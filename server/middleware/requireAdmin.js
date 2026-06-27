function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admins can perform this action" });
  }
  next();
}

module.exports = requireAdmin;