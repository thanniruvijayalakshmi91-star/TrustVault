const {pool}=require("../db");
function requireAuth(req,res,next) {
  if (!req.session || !req.session.user) {
    pool.query("INSERT INTO audit_logs(user_id,action,details) VALUES(NULL,'DENIED_UNAUTHENTICATED',$1)",[req.method+" "+req.path])
      .catch(error=>console.error("Could not record denied request:",error.message));
    return res.status(401).json({message:"Please log in first."});
  }
  req.user = req.session.user;
  next();
}
function requireAdmin(req,res,next) {
  if (!req.user || req.user.role !== "admin") {
    if(req.user) pool.query("INSERT INTO audit_logs(user_id,action,details) VALUES($1,'DENIED_ADMIN',$2)",[req.user.id,req.method+" "+req.path])
      .catch(error=>console.error("Could not record denied admin request:",error.message));
    return res.status(403).json({message:"Admin access required."});
  }
  next();
}
module.exports = {requireAuth,requireAdmin};
