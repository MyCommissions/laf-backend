const express = require('express');
const router = express.Router();
const { ROLES } = require('../utils/roles');
const AuthController = require('../controllers/auth.controller');
const AuthMiddleware = require('../middlewares/auth.middleware');

router.post('/admin/create-account', AuthMiddleware.authorize, AuthMiddleware.hasRole(ROLES.ADMIN), AuthController.createAccount);
router.post('/register', AuthController.signUp);
router.post('/login', AuthController.login);                                                                                                                                                                                                      

module.exports = router;