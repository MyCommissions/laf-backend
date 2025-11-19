const { ZodError } = require('zod');
const AuthService = require('../services/auth.service');
const Validation = require('../validations/authSchema');
const jwt = require('jsonwebtoken');

const createAccount = async (req, res) => {
  try {
    const result = Validation.createAccountSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        status: "fail",
        message: result.error.errors[0].message
      });
    }

    const account = await AuthService.createAccount(result.data, req.user);

    return res.status(201).json({
      status: "success",
      message: "Account created successfully!",
      data: account
    });

  } catch (error) {
    console.log(error);

    const knownErrors = {
      'All fields are required': 400,
      'please login to create an account': 401,
      'User already exists': 409,
      'Only admin can create an account': 403,
    };

    if (knownErrors[error.message]) {
      return res.status(knownErrors[error.message]).json({
        status: "fail",
        message: error.message
      });
    }

    if (error instanceof ZodError) {
      return res.status(400).json({
        status: "fail",
        message: error.errors.map(e => e.message)
      });
    }

    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};

const signUp = async (req, res) => {
  try {
    const result = Validation.signUpSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        status: "fail",
        message: result.error.errors[0].message
      });
    }

    await AuthService.signUp(result.data);
    return res.status(201).json({
      status: "success",
      message: "Account created successfully!"
    });

  } catch (error) {
    console.log(error);
    const knownErrors = {
      'All fields are required': 400,
      'User already exists': 409,
    };
    if (knownErrors[error.message]) {
      return res.status(knownErrors[error.message]).json({
        status: "fail",
        message: error.message
      });
    }
    if (error instanceof ZodError) {
      return res.status(400).json({
        status: "fail",
        message: error.errors.map(e => e.message)
      });
    }
    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};

const login = async (req, res) => {
  try {
    const result = Validation.loginSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        status: "fail",
        message: result.error.errors[0].message
      });
    }

    const { user } = await AuthService.login(result.data);

    const token = jwt.sign(
    { userId: user._id, roleId: user.roleId },
    process.env.JWT_SECRET,
    { expiresIn: result.rememberMe ? '30d' : '2h' }
  );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    return res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.roleId
        }
      }
    });

  } catch (error) {
    console.log(error);

    if (['Invalid credentials', 'Invalid password'].includes(error.message)) {
      return res.status(401).json({
        status: "fail",
        message: error.message
      });
    }

    if (error instanceof ZodError) {
      return res.status(400).json({
        status: "fail",
        message: error.errors.map(e => e.message)
      });
    }

    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: "fail",
        message: "Not authenticated",
      });
    }

    const user = await AuthService.getCurrentUser(req.user.userId);

    return res.status(200).json({
      status: "success",
      data: {
        user: {
          id: user._id,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          role: user.roleId,
        },
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: true, // set to true if HTTPS in production
      sameSite: "none",
      path: "/",
    });

    return res.status(200).json({
      status: "success",
      message: "Logged out successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const result = Validation.updateUserSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        status: "fail",
        message: result.error.errors[0].message,
      });
    }

    const updated = await AuthService.updateUser(
      req.params.id,
      result.data,
      req.user
    );

    return res.status(200).json({
      status: "success",
      message: "User updated successfully",
      data: {
        user: {
          id: updated.user._id,
          firstname: updated.user.firstname,
          lastname: updated.user.lastname,
          email: updated.user.email,
          role: updated.user.roleId,
        },
      },
    });
  } catch (error) {
    console.log(error);

    const knownErrors = {
      "User not found": 404,
      "Please login to update a user": 401,
      "You are not authorized to update this user": 403,
      "Email already in use": 409,
      "Current password is required to change your password": 400,
      "Current password is incorrect": 400,
      "New password and confirm password do not match": 400,
    };

    if (knownErrors[error.message]) {
      return res.status(knownErrors[error.message]).json({
        status: "fail",
        message: error.message,
      });
    }

    if (error instanceof ZodError) {
      return res.status(400).json({
        status: "fail",
        message: error.errors.map((e) => e.message),
      });
    }

    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const getUsersByRole = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: "fail",
        message: "Not authenticated",
      });
    }

    const roleId = req.query.roleId; // e.g., 1 for admin, 2 for user
    if (!roleId) {
      return res.status(400).json({
        status: "fail",
        message: "roleId query parameter is required",
      });
    }

    const users = await AuthService.getUsersByRole(roleId);

    return res.status(200).json({
      status: "success",
      data: users.map((user) => ({
        id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        mobile: user.mobile,
        profile_picture: user.profile_picture,
        role: user.roleId,
      })),
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

module.exports = {
  createAccount,
  signUp,
  login,
  logout,
  getCurrentUser,
  updateUser,
  getUsersByRole,
};
