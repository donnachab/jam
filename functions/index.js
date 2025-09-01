const functions = require("firebase-functions");

exports.verifyAdminPin = functions.https.onCall((data, context) => {
  // Get the correct PIN from the environment configuration (our secret).
  const correctPin = functions.config().admin.pin;

  // Get the PIN submitted by the user from the web app.
  const submittedPin = data.pin;

  if (!correctPin) {
    // This is an important error check for you, the developer.
    throw new functions.https.HttpsError(
        "internal",
        "The admin PIN is not configured on the server. Please set the secret.",
    );
  }

  if (submittedPin === correctPin) {
    // If the PIN is correct, return a success message.
    return {success: true, message: "PIN verified successfully."};
  } else {
    // If the PIN is incorrect, return a failure message.
    return {success: false, message: "Incorrect PIN."};
  }
});