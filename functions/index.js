const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {setGlobalOptions} = require("firebase-functions/v2");
const admin = require("firebase-admin");
const {getStorage} = require("firebase-admin/storage");

admin.initializeApp();

setGlobalOptions({secrets: ["ADMIN_PIN"]});

exports.verifyAdminPin = onCall((request) => {
    const correctPin = process.env.ADMIN_PIN;
    if (!correctPin) {
        throw new HttpsError(
            "internal",
            "The admin PIN is not configured on the server.",
        );
    }

    if (!request.data || !request.data.pin) {
        throw new HttpsError(
            "invalid-argument",
            "The function must be called with a 'pin' argument.",
        );
    }

    if (request.data.pin === correctPin) {
        return {success: true, message: "PIN verified successfully."};
    } else {
        return {success: false, message: "Incorrect PIN."};
    }
});

exports.generateSignedUploadUrl = onCall(async (request) => {
    const correctPin = process.env.ADMIN_PIN;
    if (request.data.pin !== correctPin) {
        throw new HttpsError(
            "permission-denied",
            "Incorrect PIN provided.",
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
        console.error("Error generating signed URL:", error);
        throw new HttpsError(
            "internal",
            "Could not generate upload URL.",
        );
    }
});
