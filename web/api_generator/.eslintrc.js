module.exports = {
    "parser": "@typescript-eslint/parser",
    "plugins": ["lines-between-class-members"],
    "rules": {
        "lines-between-class-members/lines-between-class-members": ["error", "always", { "exceptAfterSingleLine": true }]
    }
};