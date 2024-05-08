const express = require("express");
const {
  createComment,
  getAllComments,
  setCommentUserIds,
  deleteComment,
} = require("../controllers/commentController");
const { protect } = require("../controllers/authController");

// mergeParams enables nested routes to access parameters (route parameters or query parameters) from the parent router.
const router = express.Router({ mergeParams: true });

router.get("/", getAllComments);
router.post("/", protect, setCommentUserIds, createComment);
router.delete("/:id", protect, deleteComment);

module.exports = router;
