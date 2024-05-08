const User = require("../models/userModel");
const Video = require("../models/videoModel");
const catchAsyncError = require("../utils/catchAsyncError");
const APIFeatures = require("../utils/apiFeatures");
const AppError = require("../utils/appError");

exports.createOne = (Model) =>
  catchAsyncError(async (req, res, next) => {
    const document = await Model.create(req.body);

    if (Model === Video) {
      await User.findByIdAndUpdate(req.body.user, {
        $push: { videos: document._id },
      });
    }

    res.status(201).json({
      status: "success",
      data: {
        document,
      },
    });
  });

exports.updateOne = (Model) =>
  catchAsyncError(async (req, res, next) => {
    const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!document) {
      return next(new AppError("No document found with that ID", 404));
    }

    res.status(200).json({
      statusbar: "success",
      data: {
        document,
      },
    });
  });

exports.deleteOne = (Model) =>
  catchAsyncError(async (req, res, next) => {
    const document = await Model.findByIdAndDelete(req.params.id);

    if (!document) {
      return next(new AppError("No document found with that ID", 404));
    }

    res.status(200).json({
      status: "success",
      data: null,
    });
  });

exports.getOne = (Model, populateOptions) =>
  catchAsyncError(async (req, res, next) => {
    let query = Model.findById(req.params.id);

    if (populateOptions) query = query.populate(populateOptions);

    const document = await query;

    if (!document) {
      return next(new AppError("No document found with that ID", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        document,
      },
    });
  });

exports.getAll = (Model, populateOptions) =>
  catchAsyncError(async (req, res, next) => {
    let documents;
    // To allow for nested GET comments on videos
    let filter = {};
    if (req.params.videoId) filter = { video: req.params.videoId };

    // Execute query
    const features = new APIFeatures(
      Model.find(filter),
      req.query,
      populateOptions
    )
      .filter()
      .sort()
      .limitFields()
      .paginate()
      .populate();

    documents = await features.query;

    res.status(200).json({
      status: "success",
      results: documents.length,
      data: {
        documents,
      },
    });
  });
