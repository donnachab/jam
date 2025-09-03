const functions = require("firebase-functions");
const admin = require("firebase-admin");
const {getStorage} = require("firebase-admin/storage");

admin.initializeApp();

exports.verifyAdminPin = functions
    .runWith({secrets: ["ADMIN_PIN"]})
    .https.onCall((data, context) => {
        // This line correctly reads the secret from the environment.
        const correctPin = process.env.ADMIN_PIN;

        if (!correctPin) {
            throw new functions.https.HttpsError(
                "internal",
                "The admin PIN is not configured on the server."
            );
        }

        // Validate that the pin was provided in the request data.
        if (!data || !data.pin) {
            throw new functions.https.HttpsError(
                "invalid-argument",
                "The function must be called with a 'pin' argument."
            );
        }

        const submittedPin = data.pin;

        if (submittedPin === correctPin) {
            return {success: true, message: "PIN verified successfully."};
        } else {
            return {success: false, message: "Incorrect PIN."};
        }
    });

exports.generateSignedUploadUrl = functions
    .runWith({secrets: ["ADMIN_PIN"]})
    .https.onCall(async (data, context) => {
        const correctPin = process.env.ADMIN_PIN;

        if (!data.pin || data.pin !== correctPin) {
            throw new functions.https.HttpsError(
                "permission-denied",
                "Incorrect PIN provided."
            );
        }

        if (!data.fileName || !data.contentType) {
            throw new functions.https.HttpsError(
                "invalid-argument",
                "The function must be called with 'fileName' and 'contentType'."
            );
        }

        const bucket = getStorage().bucket();
        const file = bucket.file(`images/${data.fileName}`);

        const options = {
            version: 'v4',
            action: 'write',
            expires: Date.now() + 15 * 60 * 1000, // 15 minutes
            contentType: data.contentType,
        };

        try {
            const [url] = await file.getSignedUrl(options);
            return {success: true, url: url};
        } catch (error) {
            console.error("Error generating signed URL:", error);
            throw new functions.https.HttpsError("internal", "Could not generate upload URL.");
        }
    });
