const Comment = require("../models/commentModel");
const Video = require("../models/videoModel");
const factory = require("../controllers/handlerFactory");
const catchAsyncError = require("../utils/catchAsyncError");

exports.setCommentUserIds = (req, res, next) => {
  // Allow nested route
  if (!req.body.video) req.body.video = req.params.videoId;
  if (!req.body.user) req.body.user = req.user._id;
  next();
};

exports.createComment = catchAsyncError(async (req, res, next) => {
  const document = await Comment.create(req.body);

  const populatedDocument = await document.populate({
    path: "user",
    select: "_id name nickname avatar likesCount",
  });

  await Video.findByIdAndUpdate(req.body.video, {
    $push: { comments: document._id },
  });

  res.status(201).json({
    status: "success",
    data: {
      document: populatedDocument,
    },
  });
});

exports.getAllComments = factory.getAll(Comment, {
  path: "user",
  select: "_id name nickname avatar likesCount",
});

exports.deleteComment = catchAsyncError(async (req, res, next) => {
  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    return next(new AppError("No comment found with that ID", 404));
  }

  if (!req.user._id.equals(comment.user)) {
    return next(new AppError("You can only delete your comment", 403));
  }

  await Video.findByIdAndUpdate(comment.video, {
    $pull: { comments: req.params.id },
  });

  await comment.deleteOne();

  res.status(200).json({
    status: "success",
    data: null,
  });
});
