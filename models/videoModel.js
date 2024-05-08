const mongoose = require("mongoose");

const User = require("../models/userModel");

const videoSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      require: [true, "A video must belong to a user"],
    },
    description: {
      type: String,
      required: [true, "A video must have a description!"],
    },
    view: {
      type: Number,
      default: 0,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    thumbnailURL: {
      type: String,
      required: true,
    },
    videoURL: {
      type: String,
      required: true,
    },
    tags: {
      type: [String],
      enum: [
        "dancing",
        "comedy",
        "sports",
        "anime",
        "shows",
        "daily life",
        "beauty",
        "games",
        "cars",
        "food",
        "animal",
        "fitness",
      ],
      default: [],
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

videoSchema.index({ userId: 1 });
videoSchema.index({ title: 1 });
videoSchema.index({ createdAt: -1 });

videoSchema.virtual("likesCount").get(function () {
  return this.likes?.length || 0;
});

videoSchema.virtual("favoritesCount").get(function () {
  return this.favorites?.length || 0;
});

videoSchema.virtual("commentsCount").get(function () {
  return this.comments?.length || 0;
});

const Video = mongoose.model("Video", videoSchema);

module.exports = Video;
