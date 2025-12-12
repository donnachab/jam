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
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
    }

    const uid = request.auth.uid;

    // Check rate limiting
    await checkRateLimit(uid);

    const correctPin = process.env.ADMIN_PIN;
    if (!correctPin) {
        throw new HttpsError("internal", "The admin PIN is not configured on the server.");
    }

    // Validate PIN format
    if (!validatePin(request.data.pin)) {
        throw new HttpsError("invalid-argument", "Invalid PIN format.");
    }

    if (request.data.pin !== correctPin) {
        // Log failed attempt
        // eslint-disable-next-line no-console
        console.warn(`Failed admin login attempt for UID: ${uid}`);
        throw new HttpsError("permission-denied", "Incorrect PIN provided.");
    }

    // Reset rate limit on successful auth
    await resetRateLimit(uid);

    try {
        const expiresAt = Date.now() + ADMIN_SESSION_DURATION;
        await admin.auth().setCustomUserClaims(uid, {
            admin: true,
            adminExpiresAt: expiresAt,
        });

        // Log successful admin access
        const db = getFirestore();
        await db.collection("audit_logs").add({
            uid: uid,
            action: "admin_login",
            timestamp: FieldValue.serverTimestamp(),
            expiresAt: new Date(expiresAt),
        });

        // eslint-disable-next-line no-console
        console.log(`Admin access granted to UID: ${uid}, expires at: ${new Date(expiresAt).toISOString()}`);

        return {
            success: true,
            message: "Admin claim set successfully.",
            expiresAt: expiresAt,
        };
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error setting custom claim:", error);
        throw new HttpsError("internal", "Could not set admin claim.");
    }
});

/**
 * Verify admin claim is valid and not expired
 * @param {object} auth - Request auth object
 * @return {void}
 */
function verifyAdminAccess(auth) {
    if (!auth || !auth.token.admin) {
        throw new HttpsError(
            "permission-denied",
            "You must be an admin to perform this action.",
        );
    }

    // Check if admin session has expired
    if (auth.token.adminExpiresAt && Date.now() > auth.token.adminExpiresAt) {
        throw new HttpsError(
            "permission-denied",
            "Admin session has expired. Please log in again.",
        );
    }
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
    verifyAdminAccess(request.auth);

    if (!request.data.fileName || !request.data.contentType) {
        throw new HttpsError(
            "invalid-argument",
            "The function must be called with 'fileName' and 'contentType'.",
        );
    }

    // Validate and sanitize inputs
    const sanitizedFileName = sanitizeFileName(request.data.fileName);
    validateContentType(request.data.contentType);

    const bucket = getStorage().bucket();
    const file = bucket.file(`images/${sanitizedFileName}`);

    const options = {
        version: "v4",
        action: "write",
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        contentType: request.data.contentType,
    };

    try {
        const [url] = await file.getSignedUrl(options);

        // Log admin action
        const db = getFirestore();
        await db.collection("audit_logs").add({
            uid: request.auth.uid,
            action: "generate_upload_url",
            fileName: sanitizedFileName,
            timestamp: FieldValue.serverTimestamp(),
        });

        return {success: true, url: url};
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error generating signed URL:", error);
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
