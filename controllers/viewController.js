const Video = require("../models/videoModel");
const User = require("../models/userModel");
const catchAsyncError = require("../utils/catchAsyncError");
const apiFeatures = require("../utils/apiFeatures");

exports.getRandomVideos = catchAsyncError(async (req, res, next) => {
  let videoIdArray = [];

  // Return a new array of videos IDs
  const getVideoIdArray = async () => {
    const videos = await Video.aggregate([
      {
        $sample: {
          size: 100,
        },
      },
    ]);

    videoIdArray = videos.map((video) => {
      return video._id;
    });
  };

  if (req.cookies.videoList && req.cookies.videoList.length > 0) {
    if (req.query.new === "true") {
      // Return new videoIdArray when user first loads page or reloads the page
      await getVideoIdArray();
    } else {
      // If the user just scrolls down, get the previous videoIdArray from cookies
      videoIdArray = req.cookies.videoList;
    }
  } else {
    // Return new videoIdArray when user first loads page
    await getVideoIdArray();
  }

  // Save videoList to cookie
  res.cookie("videoList", videoIdArray, {
    maxAge: 60 * 60 * 12 * 1000,
    withCredentials: true,
    httpOnly: true,
    secure: true, // when the environment is set to production
    sameSite: "None", // Allow cross-site usage
  });

  const page = req.query.page || 1;
  const perPage = 5;
  const start = (page - 1) * perPage;
  const end = start + perPage;

  const paginatedIds = videoIdArray.slice(start, end);

  let fetchedVideos = await Video.find({ _id: { $in: paginatedIds } })
    .populate({
      path: "user",
      select: "-__v name avatar nickname",
    })
    .select("-__v");

  // Check if there are more videos to fetch, if no then return a message
  if (page * perPage >= videoIdArray.length + perPage) {
    res.status(200).json({
      status: "success",
      message: "You have watched all the videos",
    });
    return;
  }

  // Return list of videos
  res.status(200).json({
    status: "success",
    amount: fetchedVideos.length,
    data: { videos: fetchedVideos },
  });
});

exports.getFollowingVideos = catchAsyncError(async (req, res, next) => {
  const followingUsers = req.user.following;

  const followingVideos = (
    await Promise.all(
      followingUsers.map((user) => {
        return Video.find({ user: user._id })
          .populate({
            path: "user",
            select: "-__v name avatar nickname",
          })
          .sort({ createdAt: -1 })
          .select("-__v");
      })
    )
  ).flat();

  // Return all videos if no page query parameter
  if (req.query.page === undefined && req.query.limit === undefined) {
    res.status(200).json({
      status: "success",
      amount: followingVideos.length,
      data: { videos: followingVideos },
    });
    return;
  }

  const page = req.query.page || 1;
  const perPage = 5;
  const start = (page - 1) * perPage;
  const end = start + perPage;

  const videos = followingVideos.slice(start, end);

  // Check if there are more videos to fetch
  if (page * perPage >= followingVideos.length + perPage) {
    res.status(200).json({
      status: "success",
      message: "You have watched all the videos",
      data: { videos: [] },
    });
    return;
  }

  res.status(200).json({
    status: "success",
    amount: videos.length,
    data: { videos },
  });
});

exports.getVideoByTags = catchAsyncError(async (req, res, next) => {
  const tag = req.query.tag;

  const videos = await Video.find({ tag: tag })
    .select("-__v")
    .populate({ path: "user" });

  res.status(200).json({
    status: "success",
    amount: videos.length,
    data: { videos },
  });
});
