const express = require("express");
const { getMyStats } = require("../controllers/statsController");

const router = express.Router();

router.get("/me", getMyStats);

module.exports = router;
