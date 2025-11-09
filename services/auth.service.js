const User = require('../models/user');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../utils/roles');
const jwt = require('jsonwebtoken');

const createAccount = async (data, currentUser) => {

    const { firstname, lastname, email, roleId, password } = data;

    if (!firstname || !lastname || !email || !roleId || !password) {
        throw new Error('All fields are required');
    }

    if (!currentUser) {
        throw new Error('please login to create an account');
    }
    
    const existingUser = await User.findOne({ email });

    if (existingUser) {
        throw new Error('User already exists');
    }

    if (currentUser.roleId !== ROLES.ADMIN) {
        throw new Error('Only admin can create an account');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
        firstname,
        lastname,
        email,
        roleId,
        password: hashedPassword,
    })

    return { newUser };
    
}

const signUp = async (data) => {
    const { firstname, lastname, email, password } = data;

    if (!firstname || !lastname || !email || !password) {
        throw new Error('All fields are required');
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
        throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
        firstname,
        lastname,
        email,
        roleId: 2, // Default role is Staff
        password: hashedPassword,
    });

    return { newUser };
}

const login = async ({ email, password }) => {

    const user = await User.findOne({ email });

    if (!user) {
        throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        throw new Error('Invalid password');
    }

    return { user };

}

const getCurrentUser = async (userId) => {
  const user = await User.findById(userId).select("-password"); // never return password
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};

const updateUser = async (userId, data, currentUser) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  if (!currentUser) {
    throw new Error('Please login to update a user');
  }

  // Only admin can update others or roles
  if (currentUser.roleId !== ROLES.ADMIN && currentUser._id.toString() !== userId) {
    throw new Error('You are not authorized to update this user');
  }

  const { firstname, lastname, email, roleId, password } = data;

  // If email is being changed, ensure it’s unique
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('Email already in use');
    }
    user.email = email;
  }

  // Update allowed fields
  if (firstname) user.firstname = firstname;
  if (lastname) user.lastname = lastname;

  // Only admins can change roles
  if (roleId && currentUser.roleId === ROLES.ADMIN) {
    user.roleId = roleId;
  }

  // Hash password if provided
  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
  }

  await user.save();
  return { user };
};

const deleteUser = async (userId, currentUser) => {
  if (!currentUser || currentUser.roleId !== ROLES.ADMIN) {
    throw new Error('Only admin can delete users');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  await User.findByIdAndDelete(userId);
  return { message: 'User deleted successfully' };
};

module.exports = {
  createAccount,
  signUp,
  login,
  getCurrentUser,
  updateUser,
  deleteUser,
};