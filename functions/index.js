const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");

const adminPin = defineSecret("ADMIN_PIN");

exports.verifyAdminPin = onCall(
    {secrets: [adminPin]},
    (request) => {
    // eslint-disable-next-line no-console
        console.log("Request data:", request.data);

        const {pin} = request.data || {};

        if (!pin) {
            throw new HttpsError(
                "invalid-argument",
                "PIN is required."
            );
        }

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
        }

        return {
            success: false,
            message: "Invalid PIN.",
        };
    }
);
