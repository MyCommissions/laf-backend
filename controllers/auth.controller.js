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

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
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

module.exports = {
  createAccount,
  signUp,
  login
};
