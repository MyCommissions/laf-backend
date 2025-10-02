const express = require("express");
const router = express.Router();
const { ROLES } = require("../utils/roles");
const AuthController = require("../controllers/auth.controller");
const AuthMiddleware = require("../middlewares/auth.middleware");

// POST : ACCOUNT CREATION
router.post(
  "/admin/create-account",
  AuthMiddleware.authorize,
  AuthMiddleware.hasRole(ROLES.ADMIN),
  AuthController.createAccount
);

router.post("/register", AuthController.signUp);

// POST : ACCOUNT LOGIN
router.post("/login", AuthController.login);

// GET : CURRENT USER
router.get(
  "/me",
  AuthMiddleware.authorize, // makes sure JWT in cookie is valid
  AuthController.getCurrentUser
);

// POST : LOGOUT
router.post(
  "/logout",
  AuthMiddleware.authorize, // optional: require valid JWT before logout
  AuthController.logout
);

module.exports = router;
