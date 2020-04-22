require("reflect-metadata");

module.exports = {
    env: {
        API_ROOT: process.env["API_ROOT"] && process.env["API_ROOT"].trim().length > 0 ? process.env["API_ROOT"].trim() : "//newdev.smilebasicsource.com"
    }
};