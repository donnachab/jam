module.exports = {
    env: {
        es6: true,
        node: true,
    },
    extends: [
        "eslint:recommended",
        "google",
    ],
    rules: {
        "no-restricted-globals": ["error", "name", "length"],
        "prefer-arrow-callback": "error",
        "quotes": ["error", "double", {"allowTemplateLiterals": true}],
        "object-curly-spacing": ["error", "never"],
        "indent": ["error", 4],
        "max-len": ["error", {"code": 100}],
        "no-unused-vars": "error",
        "no-console": "warn",
        "eqeqeq": "error",
        "no-eval": "error",
    },
    overrides: [
        {
            files: ["**/*.spec.*"],
            env: {
                mocha: true,
            },
            rules: {},
        },
    ],
    globals: {},
};
