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
    throw new Error("User not found");
  }

  if (!currentUser) {
    throw new Error("Please login to update a user");
  }

  // Only admin can update others or roles
  const isAdmin = currentUser.roleId === ROLES.ADMIN;
  if (!isAdmin && currentUser._id.toString() !== userId) {
    throw new Error("You are not authorized to update this user");
  }

  const {
    firstname,
    lastname,
    email,
    roleId,
    currentPassword,
    newPassword,
    confirmPassword,
  } = data;

  // Email uniqueness check
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error("Email already in use");
    }
    user.email = email;
  }

  // Update basic fields
  if (firstname) user.firstname = firstname;
  if (lastname) user.lastname = lastname;

  // Only admins can change roles
  if (roleId && isAdmin) {
    if (![ROLES.ADMIN, ROLES.STAFF].includes(roleId)) {
      throw new Error("Role ID must be either 1 (Admin) or 2 (Staff)");
    }
    user.roleId = roleId;
  }

  // Handle password change
  if (newPassword || confirmPassword) {
    if (!newPassword || !confirmPassword) {
      throw new Error("Both newPassword and confirmPassword are required");
    }

    if (newPassword !== confirmPassword) {
      throw new Error("New password and confirm password do not match");
    }

    if (!currentPassword) {
      throw new Error("Current password is required to change your password");
    }

    const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentValid) {
      throw new Error("Current password is incorrect");
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
  }

  await user.save();
  return { user };
};

const getUsersByRole = async (roleId) => {
  const users = await User.find({ roleId }).select("-password");
  if (!users || users.length === 0) {
    throw new Error("No users found for this role");
  }
  return users;
};

module.exports = {
  createAccount,
  signUp,
  login,
  getCurrentUser,
  updateUser,
  getUsersByRole,
};