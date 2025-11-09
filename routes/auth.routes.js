const express = require("express");
const router = express.Router();
const { ROLES } = require("../utils/roles");
const AuthController = require("../controllers/auth.controller");
const AuthMiddleware = require("../middlewares/auth.middleware");

// POST : ACCOUNT CREATION (Admin only)
router.post(
  "/admin/create-account",
  AuthMiddleware.authorize,
  AuthMiddleware.hasRole(ROLES.ADMIN),
  AuthController.createAccount
);

// POST : REGISTER (Public)
router.post("/register", AuthController.signUp);

// POST : LOGIN (Public)
router.post("/login", AuthController.login);

// GET : CURRENT USER (Authenticated)
router.get("/me", AuthMiddleware.authorize, AuthController.getCurrentUser);

// PUT : UPDATE USER (Admin or Owner)
router.put("/update/:id", AuthMiddleware.authorize, AuthController.updateUser);

// POST : LOGOUT (Authenticated)
router.post("/logout", AuthMiddleware.authorize, AuthController.logout);

module.exports = router;