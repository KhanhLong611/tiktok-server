const crypto = require("crypto");
const jwt = require("jsonwebtoken");
// const { promisify } = require("util");

const User = require("../models/userModel");
const catchAsyncError = require("../utils/catchAsyncError");
const AppError = require("../utils/appError");
const Email = require("../utils/email");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    withCredentials: true,
    httpOnly: true,
    secure: true, // when the environment is set to production
  };

  res.cookie("jwt", token, cookieOptions);

  // Remove password from output
  user.password = undefined;
  user.passwordChangedAt = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.signUp = catchAsyncError(async (req, res, next) => {
  const newUser = await User.create({
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
  });

  // Send welcome email
  const homeUrl = `${req.protocol}://${req.get("host").split(":")[0]}:3000`;
  await new Email({ user: newUser, url: homeUrl }).sendWelcome();

  // Having a token sent to the client means the user is signed in
  createSendToken(newUser, 201, res);
});

exports.login = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }

  const user = await User.findOne({
    email: email,
  }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401)); // Unauthorized
  }

  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    withCredentials: true,
    httpOnly: true,
    secure: true, // when the environment is set to production
  });
  res.status(200).json({
    status: "success",
  });
};

exports.protect = catchAsyncError(async (req, res, next) => {
  // 1) Get the token and check if it exists
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access", 401)
    );
  }

  // 2) Verify the token
  let decoded;
  // Return the payload of the JWT
  jwt.verify(token, process.env.JWT_SECRET, (err, data) => {
    if (err) {
      // If there's an error during verification (e.g., expired or invalid token)
      return next(new AppError("Invalid token. Please log in again.", 401));
    } else decoded = data;
  });

  // 3) Check if the user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError("The user belongs to this token no longer exists", 401)
    );
  }

  // 4) Check if the user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password. Please log in again", 401)
    );
  }

  // 5) Grant access to the protected route
  req.user = currentUser;
  next();
});

exports.sendForgotPasswordToken = catchAsyncError(async (req, res, next) => {
  // 1) Get user based on the POST request
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError("There is no user with that email address", 404));
  }

  // 2) Generate random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send reset token to the user's email address
  try {
    await new Email({ user, resetToken }).sendPasswordReset();

    res.status(200).json({
      status: "success",
      message: "Token sent successfully to email",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        "There was an error sending the email. Please try again later",
        500
      )
    );
  }
});

exports.resetPassword = catchAsyncError(async (req, res, next) => {
  // 1) Get user based on token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  // 2) If token hasn't expired and there is an user, update new password
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Update passwordChangedAt property for the user

  // 4) Log the user in, send the JWT to the client
  createSendToken(user, 200, res);
});

// This one only changes user's password for logged in users. Update the user's information is another function in the userController
exports.updatePassword = catchAsyncError(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user._id).select("+password");

  // 2) Check if the current POSTed password is correct
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new AppError("Your current password is incorrect", 401));
  }

  // 3) If so, update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findByIdAndUpdate() will NOT work as intended

  // 4) Log the user in, send the JWT to the client
  createSendToken(user, 200, res);
});
