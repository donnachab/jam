const functions = require("firebase-functions");

exports.verifyAdminPin = functions.https.onCall((data, context) => {
  // This is the corrected line. It reads the secret from the environment.
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
