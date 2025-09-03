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

const cors = require("cors")({origin: true});

exports.generateSignedUploadUrl = functions
    .runWith({secrets: ["ADMIN_PIN"]})
    .https.onRequest((req, res) => {
        cors(req, res, async () => {
            const correctPin = process.env.ADMIN_PIN;

            if (req.method !== "POST") {
                return res.status(405).send("Method Not Allowed");
            }

            if (!req.body.data.pin || req.body.data.pin !== correctPin) {
                return res.status(403).json({
                    error: {
                        status: "PERMISSION_DENIED",
                        message: "Incorrect PIN provided.",
                    },
                });
            }

            if (!req.body.data.fileName || !req.body.data.contentType) {
                return res.status(400).json({
                    error: {
                        status: "INVALID_ARGUMENT",
                        message: "The function must be called with 'fileName' and 'contentType'.",
                    },
                });
            }

            const bucket = getStorage().bucket();
            const file = bucket.file(`images/${req.body.data.fileName}`);

            const options = {
                version: 'v4',
                action: 'write',
                expires: Date.now() + 15 * 60 * 1000, // 15 minutes
                contentType: req.body.data.contentType,
            };

            try {
                const [url] = await file.getSignedUrl(options);
                return res.status(200).json({data: {success: true, url: url}});
            } catch (error) {
                console.error("Error generating signed URL:", error);
                return res.status(500).json({
                    error: {
                        status: "INTERNAL",
                        message: "Could not generate upload URL.",
                    },
                });
            }
        });
    });
