const express = require("express");
const { createRoom, joinRoom, getRoom, startRoom, endRoom, saveMessage, getResults } = require("../controllers/gdController");

const router = express.Router();

router.post("/create",          createRoom);
router.post("/join",            joinRoom);
router.get("/room/:roomId",     getRoom);
router.post("/start/:roomId",   startRoom);
router.post("/end/:roomId",     endRoom);
router.post("/message",         saveMessage);
router.get("/result/:roomId",   getResults);

module.exports = router;
