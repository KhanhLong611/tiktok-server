const mongoose = require("mongoose");
const Video = require("../models/videoModel");

const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      require: [true, "A comment must belong to a user"],
    },
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      require: [true, "A comment must belong to a video"],
    },
    content: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

commentSchema.index({ userId: 1 });
commentSchema.index({ videoId: 1 });
commentSchema.index({ createdAt: -1 });

commentSchema.post("save", async function () {
  await Video.findByIdAndUpdate(this.videoId, {
    $addToSet: { comments: this._id },
  });
});

const Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;
