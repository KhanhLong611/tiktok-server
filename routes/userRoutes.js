const express = require("express");

const videoRouter = require("./videoRoutes");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");

const router = express.Router();

router.post("/signup", authController.signUp);
router.post("/login", authController.login);
router.get("/logout", authController.logout);
router.post("/forgotPassword", authController.sendForgotPasswordToken);
router.patch("/resetPassword/:token", authController.resetPassword);

router.get("/find/:id", userController.getUser);

router.use("/:id/videos", videoRouter);

// Router works like a mini app so it can use middleware
// Protect all routes after this point
router.use(authController.protect);

router.get("/me", userController.getMe);
router.get("/search", userController.searchUserByName);
router.get("/checkNicknameDuplicate", userController.checkNicknameDuplicate);
router.get("/following", userController.getFollowingUsers);
router.patch("/updateMe", userController.updateUser);
router.patch("/updateMyPassword", authController.updatePassword);
router.patch("/follow/:id", userController.followUser);
router.patch("/unfollow/:id", userController.unfollowUser);
router.patch("/like/:id", userController.likeVideo);
router.patch("/unlike/:id", userController.unlikeVideo);
router.patch("/favorite/:id", userController.saveToFavorites);
router.patch("/notfavorite/:id", userController.removeFromFavorites);

module.exports = router;
