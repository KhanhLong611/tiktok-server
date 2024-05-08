const mongoose = require("mongoose");
const validator = require("validator");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const Video = require("../models/videoModel");

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: function () {
        return `user${this._id}`;
      },
      required: [true, "Name cannot be empty!"],
    },
    nickname: {
      type: String,
      trim: true,
      default: function () {
        return `user${this._id}`;
      },
      required: [true, "Nickname cannot be empty!"],
      unique: true,
      minLength: [3, "A nickname must have more or equal than 3 characters"],
      maxLength: [30, "A nickname must have less or equal than 30 characters"],
    },
    email: {
      type: String,
      require: [true, "Please provide your email address"],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Please provide a valid email address"],
    },
    bio: {
      type: String,
      trim: true,
      default: "No bio",
      maxLength: [40, "A nickname must have less or equal than 40 character"],
      require: [true, "An user must have a bio"],
    },
    avatar: {
      type: String,
      default: "/img/default.jpeg",
    },
    videos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Video" }],
    likesCount: {
      type: Number,
      default: 0,
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    likedVideos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    favoriteVideos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      require: [true, "Please provide a password"],
      minLength: [8, "Password must be at least 8 characters"],
      maxLength: [16, "Password must not be longer than 16 characters"],
      select: false,
    },
    passwordConfirm: {
      type: String,
      require: [true, "Please confirm your password"],
      validate: {
        // This only works on CREATE and SAVE (NOT ON UPDATE OR FIND ONE AND UPDATE)
        validator: function (el) {
          return el === this.password;
        },
        message: "Passwords are not the same",
      },
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  {
    // Enable virtual properties in mongoose
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.index({ email: 1 });
userSchema.index({ name: 1 });
userSchema.index({ nickname: 1 });

// Use document middleware to hash password before saved. "this" refers to the actual document (not the query object)
userSchema.pre("save", async function (next) {
  // Only run this function if password was actually modified (when created or saved, not when updated)
  if (!this.isModified("password")) return next();

  // Hash the password with the cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete the password confirm field
  this.passwordConfirm = undefined;

  next(0);
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Use virtual properties in mongoose to calculate properties on the fly (not insisted in database)
userSchema.virtual("followingCount").get(function () {
  return this.following?.length || 0;
});

userSchema.virtual("followersCount").get(function () {
  return this.followers?.length || 0;
});

// Use query middleware and populate to populate document. "this" refers to the query object so we can chain methods to it, not the actual document
userSchema.pre(/^find/, function (next) {
  const fields = [
    "followers",
    "following",
    "videos",
    "likedVideos",
    "favoriteVideos",
  ];

  // this.populate({
  //   path: "following",
  //   select: "name nickname avatar",
  // })

  // Exclude '__v' field from the query results
  this.select("-__v");

  next();
});

// MONGOOSE SCHEMA INSTANCE METHODS. NOW ALL USERS INSTANCES HAVE THESE METHODS AVAILABLE TO THEM
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000);

    return changedTimestamp > JWTTimestamp;
  }
  // If there is no passwordChangedAt then user hasn't changed their password
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 1000 * 60 * 10;

  return resetToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
