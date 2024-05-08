const User = require("../models/userModel");
const Video = require("../models/videoModel");
const catchAsyncError = require("../utils/catchAsyncError");
const factory = require("../controllers/handlerFactory");

exports.increaseView = catchAsyncError(async (req, res, next) => {
  await Video.findByIdAndUpdate(req.params.id, {
    $inc: { view: 1 },
  });

  res.status(200).json({
    status: "success",
    message: "The view has been increased",
  });
});

exports.getVideo = factory.getOne(Video, {
  path: "user",
  select: "name nickname likesCount avatar followers",
});

exports.getUserVideos = catchAsyncError(async (req, res, next) => {
  const userId = req.params.id;

  const page = req.query.page || 1;
  const perPage = req.query.limit;
  const skip = (page - 1) * perPage;

  const videos = await Video.find({ user: userId })
    .select("videoURL thumbnailURL view description user")
    .populate({ path: "user", select: "nickname" })
    .skip(skip)
    .limit(perPage);

  const returnedVideos = [...videos].reverse();

  res.status(200).json({
    status: "success",
    amount: videos.length,
    data: { videos: returnedVideos },
  });
});

exports.getFavoriteVideos = catchAsyncError(async (req, res, next) => {
  const userId = req.params.id;
  const user = await User.findById(userId);

  const page = req.query.page || 1;
  const perPage = req.query.limit;
  const skip = (page - 1) * perPage;

  const videos = await Video.find({ _id: { $in: user.favoriteVideos } })
    .select("videoURL thumbnailURL view description user")
    .populate({ path: "user", select: "nickname" })
    .skip(skip)
    .limit(perPage);

  const returnedVideos = [...videos].reverse();

  res.status(200).json({
    status: "success",
    amount: videos.length,
    data: { videos: returnedVideos },
  });
});

exports.getLikedVideos = catchAsyncError(async (req, res, next) => {
  const userId = req.params.id;
  const user = await User.findById(userId);

  const page = req.query.page || 1;
  const perPage = req.query.limit;
  const skip = (page - 1) * perPage;

  const videos = await Video.find({ _id: { $in: user.likedVideos } })
    .select("videoURL thumbnailURL view description user")
    .populate({ path: "user", select: "nickname" })
    .skip(skip)
    .limit(perPage);

  const returnedVideos = [...videos].reverse();

  res.status(200).json({
    status: "success",
    amount: videos.length,
    data: { videos: returnedVideos },
  });
});

exports.createVideo = factory.createOne(Video);
