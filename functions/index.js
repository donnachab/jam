const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");

const adminPin = defineSecret("ADMIN_PIN");

exports.verifyAdminPin = onCall(
    {secrets: [adminPin]},
    (request) => {
        const {pin} = request.data;

        if (!adminPin.value()) {
            throw new HttpsError(
                "failed-precondition",
                "PIN not configured."
            );
        }

        if (pin === adminPin.value()) {
            return {
                success: true,
                message: "PIN verified successfully.",
            };
        } else {
            return {
                success: false,
                message: "Invalid PIN.",
            };
        }
    }
);
