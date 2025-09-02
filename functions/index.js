const functions = require("firebase-functions");

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