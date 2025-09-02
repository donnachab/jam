const functions = require("firebase-functions");

// This is the final, corrected function definition.
// The .runWith({ secrets: ["ADMIN_PIN"] }) part explicitly links the secret.
exports.verifyAdminPin = functions.runWith({secrets: ["ADMIN_PIN"]})
    .https.onCall((data, context) => {
      // This line correctly reads the secret from the environment.
      const correctPin = process.env.ADMIN_PIN;
      const submittedPin = data.pin;

      if (!correctPin) {
        throw new functions.https.HttpsError(
            "internal",
            "The admin PIN is not configured on the server.",
        );
      }

      if (submittedPin === correctPin) {
        return {success: true, message: "PIN verified successfully."};
      } else {
        return {success: false, message: "Incorrect PIN."};
      }
    });