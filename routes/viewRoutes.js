const express = require("express");

const { protect } = require("../controllers/authController");
const {
  getRandomVideos,
  getFollowingVideos,
  getVideoByTags,
} = require("../controllers/viewController");

const router = express.Router();

router.get("/random", getRandomVideos);
router.get("/following", protect, getFollowingVideos);
router.get("/explore", getVideoByTags);

module.exports = router;
