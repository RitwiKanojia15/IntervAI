const express = require("express");
const { upload, softAuth, uploadResume } = require("../controllers/resumeController");

const router = express.Router();

router.post("/upload", upload.single("resume"), softAuth, uploadResume);

module.exports = router;
