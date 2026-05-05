const express = require("express");
const { create, join, getById, getByCode, start, end, results } = require("../controllers/groupDiscussionController");

const router = express.Router();

router.post("/create",          create);
router.post("/join",            join);
router.get("/room/:roomId",     getById);
router.get("/code/:joinCode",   getByCode);
router.post("/start",           start);
router.post("/end",             end);
router.get("/results/:roomId",  results);

module.exports = router;
