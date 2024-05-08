const User = require("../models/userModel");
const Video = require("../models/videoModel");
const factory = require("../controllers/handlerFactory");
const catchAsyncError = require("../utils/catchAsyncError");

exports.getMe = catchAsyncError(async (req, res, next) => {
  const user = req.user;

  res.status(200).json({
    status: "success",
    data: { user },
  });
});

exports.getUser = factory.getOne(User);

exports.searchUserByName = catchAsyncError(async (req, res, next) => {
  const query = req.query.q;

  const users = await User.find({
    $or: [
      { name: { $regex: query, $options: "i" } },
      { nickname: { $regex: query, $options: "i" } },
    ],
  }).select("name nickname avatar likesCount");

  res.status(200).json({
    status: "success",
    amount: users.length,
    data: {
      users,
    },
  });
});

exports.getFollowingUsers = catchAsyncError(async (req, res, next) => {
  const users = await User.find({
    _id: { $in: req.user.following },
  });

  res.status(200).json({
    status: "success",
    amount: users.length,
    data: {
      users,
    },
  });
});

exports.followUser = catchAsyncError(async (req, res, next) => {
  const userId = req.user._id;

  await User.findOneAndUpdate(
    { _id: userId },
    { $addToSet: { following: req.params.id } }
  );
  await User.findOneAndUpdate(
    {
      _id: req.params.id,
    },
    {
      $addToSet: { followers: req.user._id },
    }
  );

  res.status(200).json({
    status: "success",
    data: null,
  });
});

exports.unfollowUser = catchAsyncError(async (req, res, next) => {
  const userId = req.user._id;

  const user = await User.findOneAndUpdate(
    { _id: userId },
    { $pull: { following: req.params.id } }
  );
  const unflUser = await User.findOneAndUpdate(
    {
      _id: req.params.id,
    },
    {
      $pull: { followers: req.user._id },
    }
  );

  res.status(200).json({
    status: "success",
    data: { user, unflUser },
  });
});

exports.likeVideo = catchAsyncError(async (req, res, next) => {
  const userId = req.user._id;
  const videoOwner = (await Video.findById(req.params.id)).user;

  await User.findByIdAndUpdate(
    { _id: userId },
    { $addToSet: { likedVideos: req.params.id } }
  );

  await User.findByIdAndUpdate(
    {
      _id: videoOwner,
    },
    {
      $inc: { likesCount: 1 },
    }
  );

  await Video.findByIdAndUpdate(
    {
      _id: req.params.id,
    },
    {
      $addToSet: { likes: userId },
    }
  );
  res.status(200).json({
    status: "success",
    data: null,
  });
});

exports.unlikeVideo = catchAsyncError(async (req, res, next) => {
  const userId = req.user._id;
  const videoOwner = (await Video.findById(req.params.id)).user;

  await User.findOneAndUpdate(
    { _id: userId },
    { $pull: { likedVideos: req.params.id } }
  );

  await User.findByIdAndUpdate(
    {
      _id: videoOwner,
    },
    {
      $inc: { likesCount: -1 },
    }
  );

  await Video.findOneAndUpdate(
    {
      _id: req.params.id,
    },
    {
      $pull: { likes: userId },
    }
  );
  res.status(200).json({
    status: "success",
    data: null,
  });
});

exports.saveToFavorites = catchAsyncError(async (req, res, next) => {
  const userId = req.user._id;
  await User.findOneAndUpdate(
    { _id: userId },
    { $addToSet: { favoriteVideos: req.params.id } }
  );
  await Video.findOneAndUpdate(
    {
      _id: req.params.id,
    },
    {
      $addToSet: { favorites: userId },
    }
  );
  res.status(200).json({
    status: "success",
    data: null,
  });
});

exports.removeFromFavorites = catchAsyncError(async (req, res, next) => {
  const userId = req.user._id;
  await User.findOneAndUpdate(
    { _id: userId },
    { $pull: { favoriteVideos: req.params.id } }
  );
  await Video.findOneAndUpdate(
    {
      _id: req.params.id,
    },
    {
      $pull: { favorites: userId },
    }
  );
  res.status(200).json({
    status: "success",
    data: null,
  });
});

exports.checkNicknameDuplicate = catchAsyncError(async (req, res, next) => {
  let isDuplicate;
  const nickname = req.query.nickname;
  const currentUser = req.user;

  const user = await User.findOne({ nickname: nickname });

  if (user && user.nickname !== currentUser.nickname) {
    isDuplicate = true;
  } else {
    isDuplicate = false;
  }

  res.status(200).json({
    status: "success",
    isDuplicate,
  });
});

exports.updateUser = catchAsyncError(async (req, res, next) => {
  const user = await User.findByIdAndUpdate({ _id: req.user._id }, req.body, {
    new: true,
  });

  res.status(200).json({
    status: "success",
    data: { user },
  });
});
