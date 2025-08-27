const jwt = require('jsonwebtoken');
const { ROLES } = require('../utils/roles');

const authorize = async (req, res, next) => {

    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({
            status: "fail",
            message: "Unauthorized"
        })
    }

    const token = header.split(" ")[1];

    try {

        const decoded = await jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;

        next();

    } catch (error) {
        
        console.log(error);

        if (error.message === 'jwt expired') {
            return res.status(401).json({
                status: "fail",
                message: "Token expired"
            })
        }

        if (error.message === 'invalid signature') {
            return res.status(401).json({
                status: "fail",
                message: "Invalid token"
            })
        }

    }

}

const hasRole = (role) => {
    return (req, res, next) => {
        if (req.user.roleId !== role) {
            return res.status(403).json({
                status: 'fail',
                message: `You do not have permission to access this route`
            })
        }

        next();
    }
}

module.exports = {
    authorize,
    hasRole
}