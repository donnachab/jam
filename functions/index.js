const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");

// Define the secret parameter
const adminPin = defineSecret("ADMIN_PIN");

// Export the function with the new v2 syntax
exports.verifyAdminPin = onCall({
    secrets: [adminPin],
}, async (request) => {
    // Get the PIN from the request data
    const submittedPin = request.data.pin;
    
    // Get the correct PIN from the secret
    const correctPin = adminPin.value();
    
    if (!correctPin) {
        throw new HttpsError(
            "internal",
            "The admin PIN is not configured on the server."
        );
    }
    
    if (submittedPin === correctPin) {
        return {success: true, message: "PIN verified successfully."};
    } else {
        return {success: false, message: "Incorrect PIN."};
    }
});
