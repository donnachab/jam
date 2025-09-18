const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {setGlobalOptions} = require("firebase-functions/v2");
const admin = require("firebase-admin");
const {getStorage} = require("firebase-admin/storage");

admin.initializeApp();

setGlobalOptions({secrets: ["ADMIN_PIN"]});


/**
 * Sets a custom claim on the user's token to grant admin privileges.
 * Requires the user to be authenticated and provide the correct admin PIN.
 */
exports.setAdminClaim = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
    }

    const correctPin = process.env.ADMIN_PIN;
    if (!correctPin) {
        throw new HttpsError("internal", "The admin PIN is not configured on the server.");
    }

    if (request.data.pin !== correctPin) {
        throw new HttpsError("permission-denied", "Incorrect PIN provided.");
    }

    const uid = request.auth.uid;
    try {
        await admin.auth().setCustomUserClaims(uid, {admin: true});
        return {success: true, message: "Admin claim set successfully."};
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error setting custom claim:", error);
        throw new HttpsError("internal", "Could not set admin claim.");
    }
});

/**
 * Generates a signed URL for uploading a file.
 * Requires the user to be an admin (verified via custom claim).
 */
exports.generateSignedUploadUrl = onCall(async (request) => {
    if (!request.auth || !request.auth.token.admin) {
        throw new HttpsError(
            "permission-denied",
            "You must be an admin to perform this action.",
        );
    }

    if (!request.data.fileName || !request.data.contentType) {
        throw new HttpsError(
            "invalid-argument",
            "The function must be called with 'fileName' and 'contentType'.",
        );
    }

    const bucket = getStorage().bucket();
    const file = bucket.file(`images/${request.data.fileName}`);

    const options = {
        version: "v4",
        action: "write",
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        contentType: request.data.contentType,
    };

    try {
        const [url] = await file.getSignedUrl(options);
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
        return {success: true, message: "Admin claim revoked successfully."};
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error revoking custom claim:", error);
        throw new HttpsError("internal", "Could not revoke admin claim.");
    }
});
