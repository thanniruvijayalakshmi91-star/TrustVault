const express=require("express");
const {pool}=require("../db");
const {requireAuth,requireAdmin}=require("../middleware/auth");
const router=express.Router();
router.get("/stats",requireAuth,requireAdmin,async(_req,res)=>{
 try{const [u,d,s,a]=await Promise.all([pool.query("SELECT COUNT(*)::int count FROM users"),pool.query("SELECT COUNT(*)::int count FROM documents"),pool.query("SELECT COUNT(*)::int count FROM document_shares"),pool.query("SELECT id,action,details,created_at,user_id FROM audit_logs ORDER BY created_at DESC LIMIT 30")]);res.json({users:u.rows[0].count,documents:d.rows[0].count,shares:s.rows[0].count,recentActivity:a.rows});}
 catch(e){console.error(e.message);res.status(500).json({message:"Could not load admin dashboard."});}
});
module.exports=router;
