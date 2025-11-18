const jwt = require("jsonwebtoken");
const { ROLES } = require("../utils/roles");

const authorize = (req, res, next) => {
  const token = req.cookies.token; // ✅ cookie-parser must be installed and used

  if (!token) {
    return res
      .status(401)
      .json({ status: "fail", message: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ status: "fail", message: "Unauthorized: Invalid token" });
  }
};


const hasRole = (role) => {
  return (req, res, next) => {
    
    if (!req.user) {
      console.log("No user found");
      return res.status(401).json({
        status: "fail",
        message: "Unauthorized: No user found",
      });
    }

    if (req.user.roleId !== role) {
      console.log(
        `Role mismatch. Expected: ${role}, Got: ${req.user.roleId}`
      );
      return res.status(403).json({
        status: "fail",
        message: "You do not have permission to access this route",
      });
    }

    console.log(`Access granted for role: ${req.user.roleId}`);
    next();
  };
};

module.exports = {
  authorize,
  hasRole,
};
