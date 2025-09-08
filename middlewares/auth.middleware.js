const jwt = require("jsonwebtoken");
const { ROLES } = require("../utils/roles");

const authorize = async (req, res, next) => {
  try {
    // Check header OR cookie
    const header = req.headers.authorization;
    const token =
      (header && header.startsWith("Bearer ") && header.split(" ")[1]) ||
      req.cookies?.token; // 👈 fallback to cookie

    if (!token) {
      return res.status(401).json({
        status: "fail",
        message: "Unauthorized: No token provided",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    next();
  } catch (error) {
    console.error("Auth error:", error.message);

    if (error.message === "jwt expired") {
      return res.status(401).json({
        status: "fail",
        message: "Token expired",
      });
    }

    if (error.message === "invalid signature") {
      return res.status(401).json({
        status: "fail",
        message: "Invalid token",
      });
    }

    return res.status(401).json({
      status: "fail",
      message: "Unauthorized",
    });
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
