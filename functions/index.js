const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {setGlobalOptions} = require("firebase-functions/v2");
const admin = require("firebase-admin");
const {getStorage} = require("firebase-admin/storage");
const {getFirestore, FieldValue} = require("firebase-admin/firestore");

admin.initializeApp();

setGlobalOptions({secrets: ["ADMIN_PIN"]});

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5; // Max attempts per window
const LOCKOUT_DURATION = 60 * 60 * 1000; // 1 hour lockout after max attempts
const ADMIN_SESSION_DURATION = 4 * 60 * 60 * 1000; // 4 hours

/**
 * Check and enforce rate limiting for admin PIN attempts
 * @param {string} uid - User ID
 * @return {Promise<void>}
 */
async function checkRateLimit(uid) {
    const db = getFirestore();
    const rateLimitRef = db.collection("rate_limits").doc(uid);
    const doc = await rateLimitRef.get();
    const now = Date.now();

    if (!doc.exists) {
        // First attempt
        await rateLimitRef.set({
            attempts: 1,
            windowStart: now,
            lockedUntil: null,
        });
        return;
    }

    const data = doc.data();

    // Check if user is locked out
    if (data.lockedUntil && now < data.lockedUntil) {
        const remainingMinutes = Math.ceil((data.lockedUntil - now) / 60000);
        throw new HttpsError(
            "resource-exhausted",
            `Too many failed attempts. Please try again in ${remainingMinutes} minutes.`,
        );
    }

    // Reset window if expired
    if (now - data.windowStart > RATE_LIMIT_WINDOW) {
        await rateLimitRef.set({
            attempts: 1,
            windowStart: now,
            lockedUntil: null,
        });
        return;
    }

    // Check if max attempts reached
    if (data.attempts >= MAX_ATTEMPTS) {
        const lockedUntil = now + LOCKOUT_DURATION;
        await rateLimitRef.update({
            lockedUntil: lockedUntil,
            attempts: FieldValue.increment(1),
        });
        throw new HttpsError(
            "resource-exhausted",
            `Too many failed attempts. Account locked for 1 hour.`,
        );
    }

    // Increment attempts
    await rateLimitRef.update({
        attempts: FieldValue.increment(1),
    });
}

/**
 * Reset rate limit after successful authentication
 * @param {string} uid - User ID
 * @return {Promise<void>}
 */
async function resetRateLimit(uid) {
    const db = getFirestore();
    await db.collection("rate_limits").doc(uid).delete();
}

/**
 * Validate and sanitize PIN input
 * @param {string} pin - PIN to validate
 * @return {boolean}
 */
function validatePin(pin) {
    // PIN must be a string of 4-8 digits
    if (typeof pin !== "string") return false;
    if (!/^\d{4,8}$/.test(pin)) return false;
    return true;
}

/**
 * Sets a custom claim on the user's token to grant admin privileges.
 * Requires the user to be authenticated and provide the correct admin PIN.
 * Implements rate limiting and session expiration.
 */
exports.setAdminClaim = onCall(async (request) => {
    // eslint-disable-next-line no-console
    console.log("🔐 [DEBUG] ========================================");
    // eslint-disable-next-line no-console
    console.log("🔐 [DEBUG] setAdminClaim function called");
    // eslint-disable-next-line no-console
    console.log("🔐 [DEBUG] ========================================");
    
    if (!request.auth) {
        // eslint-disable-next-line no-console
        console.error("❌ [DEBUG] No authentication found in request");
        throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
    }

    const uid = request.auth.uid;
    // eslint-disable-next-line no-console
    console.log("🔐 [DEBUG] User ID:", uid);
    // eslint-disable-next-line no-console
    console.log("🔐 [DEBUG] Request data:", JSON.stringify(request.data, null, 2));

    // Check rate limiting
    // eslint-disable-next-line no-console
    console.log("🔐 [DEBUG] Checking rate limit...");
    try {
        await checkRateLimit(uid);
        // eslint-disable-next-line no-console
        console.log("✅ [DEBUG] Rate limit check passed");
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error("❌ [DEBUG] Rate limit check failed:", error.message);
        throw error;
    }

    const correctPin = process.env.ADMIN_PIN;
    // eslint-disable-next-line no-console
    console.log("🔐 [DEBUG] Admin PIN configured:", !!correctPin);
    if (!correctPin) {
        // eslint-disable-next-line no-console
        console.error("❌ [DEBUG] ADMIN_PIN environment variable not set!");
        throw new HttpsError("internal", "The admin PIN is not configured on the server.");
    }

    // Validate PIN format
    // eslint-disable-next-line no-console
    console.log("🔐 [DEBUG] Validating PIN format...");
    if (!validatePin(request.data.pin)) {
        // eslint-disable-next-line no-console
        console.error("❌ [DEBUG] Invalid PIN format provided");
        throw new HttpsError("invalid-argument", "Invalid PIN format.");
    }
    // eslint-disable-next-line no-console
    console.log("✅ [DEBUG] PIN format valid");

    // eslint-disable-next-line no-console
    console.log("🔐 [DEBUG] Comparing PIN with correct PIN...");
    if (request.data.pin !== correctPin) {
        // Log failed attempt
        // eslint-disable-next-line no-console
        console.warn(`❌ [DEBUG] Failed admin login attempt for UID: ${uid}`);
        // eslint-disable-next-line no-console
        console.warn(`❌ [DEBUG] PIN provided length: ${request.data.pin.length}, Expected length: ${correctPin.length}`);
        throw new HttpsError("permission-denied", "Incorrect PIN provided.");
    }
    // eslint-disable-next-line no-console
    console.log("✅ [DEBUG] PIN matches!");

    // Reset rate limit on successful auth
    // eslint-disable-next-line no-console
    console.log("🔐 [DEBUG] Resetting rate limit...");
    await resetRateLimit(uid);
    // eslint-disable-next-line no-console
    console.log("✅ [DEBUG] Rate limit reset");

    try {
        const expiresAt = Date.now() + ADMIN_SESSION_DURATION;
        // eslint-disable-next-line no-console
        console.log("🔐 [DEBUG] Setting custom user claims...");
        // eslint-disable-next-line no-console
        console.log("🔐 [DEBUG] Expiration time:", new Date(expiresAt).toISOString());
        
        await admin.auth().setCustomUserClaims(uid, {
            admin: true,
            adminExpiresAt: expiresAt,
        });
        // eslint-disable-next-line no-console
        console.log("✅ [DEBUG] Custom claims set successfully");

        // Log successful admin access
        // eslint-disable-next-line no-console
        console.log("🔐 [DEBUG] Writing audit log...");
        const db = getFirestore();
        await db.collection("audit_logs").add({
            uid: uid,
            action: "admin_login",
            timestamp: FieldValue.serverTimestamp(),
            expiresAt: new Date(expiresAt),
        });
        // eslint-disable-next-line no-console
        console.log("✅ [DEBUG] Audit log written");

        // eslint-disable-next-line no-console
        console.log(`✅ [DEBUG] Admin access granted to UID: ${uid}, expires at: ${new Date(expiresAt).toISOString()}`);

        const response = {
            success: true,
            message: "Admin claim set successfully.",
            expiresAt: expiresAt,
        };
        // eslint-disable-next-line no-console
        console.log("✅ [DEBUG] Returning response:", JSON.stringify(response, null, 2));
        // eslint-disable-next-line no-console
        console.log("🔐 [DEBUG] ========================================");
        
        return response;
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error("❌ [DEBUG] Error setting custom claim:", error);
        // eslint-disable-next-line no-console
        console.error("❌ [DEBUG] Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        throw new HttpsError("internal", "Could not set admin claim.");
    }
});

/**
 * Verify admin claim is valid and not expired
 * @param {object} auth - Request auth object
 * @return {void}
 */
function verifyAdminAccess(auth) {
    // eslint-disable-next-line no-console
    console.log("🔒 [DEBUG] verifyAdminAccess called");
    // eslint-disable-next-line no-console
    console.log("🔒 [DEBUG] Auth object:", !!auth);
    // eslint-disable-next-line no-console
    console.log("🔒 [DEBUG] Auth token:", !!auth?.token);
    // eslint-disable-next-line no-console
    console.log("🔒 [DEBUG] Admin claim:", auth?.token?.admin);
    
    if (!auth || !auth.token.admin) {
        // eslint-disable-next-line no-console
        console.error("❌ [DEBUG] Admin access denied - no admin claim");
        throw new HttpsError(
            "permission-denied",
            "You must be an admin to perform this action.",
        );
    }

    // Check if admin session has expired
    // eslint-disable-next-line no-console
    console.log("🔒 [DEBUG] Admin expires at:", auth.token.adminExpiresAt);
    // eslint-disable-next-line no-console
    console.log("🔒 [DEBUG] Current time:", Date.now());
    
    if (auth.token.adminExpiresAt && Date.now() > auth.token.adminExpiresAt) {
        // eslint-disable-next-line no-console
        console.error("❌ [DEBUG] Admin session expired");
        throw new HttpsError(
            "permission-denied",
            "Admin session has expired. Please log in again.",
        );
    }
    
    // eslint-disable-next-line no-console
    console.log("✅ [DEBUG] Admin access verified");
}

/**
 * Sanitize and validate file name
 * @param {string} fileName - File name to validate
 * @return {string} - Sanitized file name
 */
function sanitizeFileName(fileName) {
    if (typeof fileName !== "string" || fileName.length === 0) {
        throw new HttpsError("invalid-argument", "Invalid file name.");
    }

    // Remove path traversal attempts
    const sanitized = fileName.replace(/\.\./g, "").replace(/[\/\\]/g, "");

    // Validate file extension
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
    const hasValidExtension = allowedExtensions.some((ext) =>
        sanitized.toLowerCase().endsWith(ext),
    );

    if (!hasValidExtension) {
        throw new HttpsError(
            "invalid-argument",
            "Invalid file type. Allowed: jpg, jpeg, png, gif, webp, svg",
        );
    }

    // Limit file name length
    if (sanitized.length > 255) {
        throw new HttpsError("invalid-argument", "File name too long.");
    }

    return sanitized;
}

/**
 * Validate content type
 * @param {string} contentType - Content type to validate
 * @return {void}
 */
function validateContentType(contentType) {
    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",
    ];

    if (!allowedTypes.includes(contentType)) {
        throw new HttpsError(
            "invalid-argument",
            "Invalid content type. Allowed: jpeg, png, gif, webp, svg",
        );
    }
}

/**
 * Generates a signed URL for uploading a file.
 * Requires the user to be an admin (verified via custom claim).
 * Implements input validation and sanitization.
 */
exports.generateSignedUploadUrl = onCall(async (request) => {
    // eslint-disable-next-line no-console
    console.log("📤 [DEBUG] generateSignedUploadUrl called");
    // eslint-disable-next-line no-console
    console.log("📤 [DEBUG] User ID:", request.auth?.uid);
    
    verifyAdminAccess(request.auth);

    if (!request.data.fileName || !request.data.contentType) {
        // eslint-disable-next-line no-console
        console.error("❌ [DEBUG] Missing fileName or contentType");
        throw new HttpsError(
            "invalid-argument",
            "The function must be called with 'fileName' and 'contentType'.",
        );
    }

    // eslint-disable-next-line no-console
    console.log("📤 [DEBUG] File name:", request.data.fileName);
    // eslint-disable-next-line no-console
    console.log("📤 [DEBUG] Content type:", request.data.contentType);

    // Validate and sanitize inputs
    const sanitizedFileName = sanitizeFileName(request.data.fileName);
    validateContentType(request.data.contentType);
    
    // eslint-disable-next-line no-console
    console.log("📤 [DEBUG] Sanitized file name:", sanitizedFileName);

    const bucket = getStorage().bucket();
    const file = bucket.file(`images/${sanitizedFileName}`);

    const options = {
        version: "v4",
        action: "write",
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        contentType: request.data.contentType,
    };

    try {
        // eslint-disable-next-line no-console
        console.log("📤 [DEBUG] Generating signed URL...");
        const [url] = await file.getSignedUrl(options);
        // eslint-disable-next-line no-console
        console.log("✅ [DEBUG] Signed URL generated successfully");

        // Log admin action
        // eslint-disable-next-line no-console
        console.log("📤 [DEBUG] Writing audit log...");
        const db = getFirestore();
        await db.collection("audit_logs").add({
            uid: request.auth.uid,
            action: "generate_upload_url",
            fileName: sanitizedFileName,
            timestamp: FieldValue.serverTimestamp(),
        });
        // eslint-disable-next-line no-console
        console.log("✅ [DEBUG] Audit log written");

        return {success: true, url: url};
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error("❌ [DEBUG] Error generating signed URL:", error);
        // eslint-disable-next-line no-console
        console.error("❌ [DEBUG] Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        throw new HttpsError("internal", "Could not generate upload URL.");
    }
});

/**
 * Revokes the admin custom claim from the calling user.
 */
exports.revokeAdminClaim = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
    }

    const uid = request.auth.uid;
    try {
        await admin.auth().setCustomUserClaims(uid, null);

        // Log admin logout
        const db = getFirestore();
        await db.collection("audit_logs").add({
            uid: uid,
            action: "admin_logout",
            timestamp: FieldValue.serverTimestamp(),
        });

        return {success: true, message: "Admin claim revoked successfully."};
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error revoking custom claim:", error);
        throw new HttpsError("internal", "Could not revoke admin claim.");
    }
});
