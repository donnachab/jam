const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// A fixed, hardcoded UID for the single admin user.
// This is a simple and secure approach for this type of site.
const ADMIN_UID = "gjc-admin-user";

exports.verifyAdminPin = functions
    .runWith({secrets: ["ADMIN_PIN"]})
    .https.onCall(async (data, context) => {
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
            try {
                // If the PIN is correct, create a custom auth token for our admin UID.
                const customToken = await admin.auth().createCustomToken(ADMIN_UID);
                return {success: true, token: customToken};
            } catch (error) {
                console.error("Error creating custom token:", error);
                throw new functions.httpshttps.HttpsError(
                    "internal",
                    "Could not create custom token.",
                );
            }
        } else {
            // If the PIN is incorrect, return a failure message.
            return {success: false, message: "Incorrect PIN."};
        }
    });
