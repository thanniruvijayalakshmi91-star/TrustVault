const express = require("express");
const bcrypt = require("bcryptjs");
const {pool} = require("../db");
const {requireAuth} = require("../middleware/auth");
const router = express.Router();

router.post("/register", async (req,res) => {
  try {
    const name=String(req.body.name||"").trim(), email=String(req.body.email||"").trim().toLowerCase(), password=String(req.body.password||"");
    if(name.length<2||name.length>100) return res.status(400).json({message:"Name must be 2 to 100 characters."});
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({message:"Enter a valid email."});
    if(password.length<8) return res.status(400).json({message:"Password must be at least 8 characters."});
    const hash=await bcrypt.hash(password,12);
    const role="owner";
    const result=await pool.query("INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id,name,email,role",[name,email,hash,role]);
    req.session.user=result.rows[0];
    await pool.query("INSERT INTO audit_logs(user_id,action,details) VALUES($1,'REGISTER','Account created')",[result.rows[0].id]);
    res.status(201).json({message:"Account created.",user:result.rows[0]});
  } catch(e) { if(e.code==="23505") return res.status(409).json({message:"Email is already registered."}); console.error(e.message); res.status(500).json({message:"Could not create account."}); }
});
router.post("/login", async (req,res) => {
  try {
    const email=String(req.body.email||"").trim().toLowerCase(), password=String(req.body.password||"");
    const result=await pool.query("SELECT id,name,email,password_hash,role FROM users WHERE email=$1",[email]);
    const user=result.rows[0];
    if(!user||!(await bcrypt.compare(password,user.password_hash))) return res.status(401).json({message:"Incorrect email or password."});
    req.session.regenerate(err=>{
      if(err) return res.status(500).json({message:"Could not start session."});
      req.session.user={id:user.id,name:user.name,email:user.email,role:user.role};
      pool.query("INSERT INTO audit_logs(user_id,action,details) VALUES($1,'LOGIN','User logged in')",[user.id])
        .then(()=>req.session.save(()=>res.json({message:"Login successful.",user:req.session.user})))
        .catch(e=>{console.error(e.message);res.status(500).json({message:"Could not complete login."});});
    });
  } catch(e) {console.error(e.message);res.status(500).json({message:"Could not log in."});}
});
router.get("/me",requireAuth,(req,res)=>res.json({user:req.user}));
router.post("/logout",requireAuth,(req,res)=>{
  const id=req.user.id;
  req.session.destroy(err=>{if(err)return res.status(500).json({message:"Could not log out."});res.clearCookie("trustvault.sid");pool.query("INSERT INTO audit_logs(user_id,action,details) VALUES($1,'LOGOUT','User logged out')",[id]).catch(()=>{});res.json({message:"Logged out."});});
});
module.exports=router;
