const express = require("express");

const commentsRouter = require("./commentRoutes");
const {
  increaseView,
  getVideo,
  getUserVideos,
  getFavoriteVideos,
  getLikedVideos,
  createVideo,
} = require("../controllers/videoController");
const { protect } = require("../controllers/authController");

const router = express.Router({ mergeParams: true });

router.get("/", getUserVideos);
router.post("/", protect, createVideo);
router.get("/favorites", getFavoriteVideos);
router.get("/liked", getLikedVideos);

// POST /tour/1212dsa/reviews
// GET /tour/1212dagda/reviews
router.use("/:videoId/comments", commentsRouter);

router.patch("/view/:id", increaseView);
router.get("/find/:id", getVideo);

module.exports = router;
