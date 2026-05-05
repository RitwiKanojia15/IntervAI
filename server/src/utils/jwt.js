const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "intervai_secret_key";
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

const signToken = (payload) => jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });

const verifyToken = (token) => jwt.verify(token, SECRET);

module.exports = { signToken, verifyToken };
