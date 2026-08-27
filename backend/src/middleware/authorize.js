/**
 * Role-based authorization middleware factory.
 * @param {...string} allowedRoles - List of allowed roles (e.g. 'ADMIN', 'MANAGER', 'COUNSELLOR')
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions for this resource',
      });
    }

    next();
  };
};

module.exports = {
  authorizeRoles,
};
