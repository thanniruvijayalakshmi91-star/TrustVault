function requireAuth(req,res,next) {
  if (!req.session || !req.session.user) return res.status(401).json({message:"Please log in first."});
  req.user = req.session.user; next();
}
function requireAdmin(req,res,next) {
  if (!req.user || req.user.role !== "admin") return res.status(403).json({message:"Admin access required."});
  next();
}
module.exports = {requireAuth,requireAdmin};
