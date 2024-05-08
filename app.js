const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");

const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const viewRouter = require("./routes/viewRoutes");
const userRouter = require("./routes/userRoutes");
const videoRouter = require("./routes/videoRoutes");
const commentRouter = require("./routes/commentRoutes");

// Start Express app
const app = express();

// Enable CORS
app.use(
  cors({
    credentials: true,
  })
);

// 1) GLOBAL MIDDLEWARE
// Serving static files
app.use(express.static(path.join(__dirname, "public")));

// Set security http headers
app.use(helmet());

// Logging to track http requests
app.use(morgan("dev"));

// Limit request from the same api to prevent denial of service or brute force attacks
const limiter = rateLimit({
  max: 1000,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour!",
});
app.use("/", limiter);

// Middleware body-parser. Parses incoming requests with JSON payloads into req.body (for JSON Object). Limit the data in the body to less than 10kb
app.use(express.json({ limit: "10kb" }));

// Parses incoming requests with URL-encoded payloads into req.body (for string or array)
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Cookie parser
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Prevent parameters pollution
app.use(
  hpp({
    whitelist: [],
  })
);

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(req.requestTime);
  next();
});

// 2) ROUTES
app.use("/api/v1", viewRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/comments", commentRouter);

// app.all() runs for all the verbs (all the http methods)
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
