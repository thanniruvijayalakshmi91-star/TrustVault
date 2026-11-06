const express=require("express");
const multer=require("multer");
const path=require("path");
const fs=require("fs");
const crypto=require("crypto");
const {pool}=require("../db");
const {requireAuth}=require("../middleware/auth");
const router=express.Router();
const folder=path.join(__dirname,"..","private_uploads");
fs.mkdirSync(folder,{recursive:true});
const types=new Set(["application/pdf","text/plain","image/jpeg","image/png","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]);
const upload=multer({storage:multer.diskStorage({destination:(_r,_f,cb)=>cb(null,folder),filename:(_r,_f,cb)=>cb(null,crypto.randomUUID())}),limits:{fileSize:10*1024*1024,files:1},fileFilter:(_r,f,cb)=>types.has(f.mimetype)?cb(null,true):cb(new Error("Allowed: PDF, TXT, JPG, PNG, DOCX and XLSX."))});
async function audit(uid,action,details){await pool.query("INSERT INTO audit_logs(user_id,action,details) VALUES($1,$2,$3)",[uid,action,details]);}
async function access(id,user){
 const r=await pool.query(`SELECT d.*,CASE WHEN d.owner_id=$2 OR $3='admin' THEN 'owner' ELSE s.permission END permission
 FROM documents d LEFT JOIN document_shares s ON s.document_id=d.id AND s.user_id=$2
 WHERE d.id=$1 AND (d.owner_id=$2 OR $3='admin' OR s.user_id=$2)`,[id,user.id,user.role]);return r.rows[0];
}
router.get("/",requireAuth,async(req,res)=>{
 try{
  const q=String(req.query.q||"").trim().slice(0,100);
  const r=await pool.query(`SELECT d.id,d.original_name,d.mime_type,d.file_size,d.created_at,u.name owner_name,
   CASE WHEN d.owner_id=$1 OR $2='admin' THEN 'owner' ELSE s.permission END permission,
   (d.owner_id=$1 OR $2='admin') is_owner
   FROM documents d JOIN users u ON u.id=d.owner_id LEFT JOIN document_shares s ON s.document_id=d.id AND s.user_id=$1
   WHERE (d.owner_id=$1 OR $2='admin' OR s.user_id=$1)
   AND ($3='' OR d.original_name ILIKE '%' || $3 || '%' OR u.name ILIKE '%' || $3 || '%')
   ORDER BY d.created_at DESC`,[req.user.id,req.user.role,q]);
  res.json({documents:r.rows});
 } catch(e){console.error(e.message);res.status(500).json({message:"Could not load documents."});}
});
router.get("/:id/shares",requireAuth,async(req,res)=>{
 try{
  const d=await access(req.params.id,req.user);
  if(!d || (d.permission!=="owner" && req.user.role!=="admin")) return res.status(403).json({message:"Only the owner can view sharing details."});
  const r=await pool.query("SELECT s.user_id,u.name,u.email,s.permission FROM document_shares s JOIN users u ON u.id=s.user_id WHERE s.document_id=$1 ORDER BY u.name",[d.id]);
  res.json({shares:r.rows});
 }catch(e){console.error(e.message);res.status(500).json({message:"Could not load sharing details."});}
});
router.post("/upload",requireAuth,upload.single("document"),async(req,res)=>{
 if(!req.file)return res.status(400).json({message:"Choose a file."});
 try{const r=await pool.query("INSERT INTO documents(owner_id,original_name,stored_name,mime_type,file_size) VALUES($1,$2,$3,$4,$5) RETURNING id,original_name,mime_type,file_size,created_at",[req.user.id,path.basename(req.file.originalname),req.file.filename,req.file.mimetype,req.file.size]);await audit(req.user.id,"UPLOAD","Uploaded "+path.basename(req.file.originalname));res.status(201).json({document:r.rows[0]});}
 catch(e){fs.unlink(req.file.path,()=>{});console.error(e.message);res.status(500).json({message:"Could not save document."});}
});
router.get("/:id/download",requireAuth,async(req,res)=>{
 try{const d=await access(req.params.id,req.user);if(!d)return res.status(404).json({message:"Document not found or access denied."});const p=path.join(folder,d.stored_name);if(!fs.existsSync(p))return res.status(404).json({message:"Stored file not found."});await audit(req.user.id,"DOWNLOAD","Downloaded "+d.original_name);res.download(p,d.original_name);}
 catch(e){console.error(e.message);res.status(500).json({message:"Download failed."});}
});
router.post("/:id/share",requireAuth,async(req,res)=>{
 try{const d=await access(req.params.id,req.user);if(!d||(d.permission!=="owner"&&req.user.role!=="admin"))return res.status(403).json({message:"Only the owner can share this document."});const email=String(req.body.email||"").trim().toLowerCase(),permission=req.body.permission==="edit"?"edit":"read";const target=await pool.query("SELECT id FROM users WHERE email=$1",[email]);if(!target.rows[0])return res.status(404).json({message:"No registered user has that email."});if(Number(target.rows[0].id)===Number(d.owner_id))return res.status(400).json({message:"Owner already has access."});await pool.query("INSERT INTO document_shares(document_id,user_id,permission) VALUES($1,$2,$3) ON CONFLICT(document_id,user_id) DO UPDATE SET permission=EXCLUDED.permission",[d.id,target.rows[0].id,permission]);await audit(req.user.id,"SHARE","Shared "+d.original_name+" with "+email+" ("+permission+")");res.json({message:"Access granted."});}
 catch(e){console.error(e.message);res.status(500).json({message:"Could not share document."});}
});
router.delete("/:id/share/:userId",requireAuth,async(req,res)=>{
 try{const d=await access(req.params.id,req.user);if(!d||(d.permission!=="owner"&&req.user.role!=="admin"))return res.status(403).json({message:"Only the owner can revoke access."});await pool.query("DELETE FROM document_shares WHERE document_id=$1 AND user_id=$2",[d.id,req.params.userId]);await audit(req.user.id,"REVOKE_ACCESS","Revoked access to "+d.original_name);res.json({message:"Access revoked."});}
 catch(e){console.error(e.message);res.status(500).json({message:"Could not revoke access."});}
});
router.delete("/:id",requireAuth,async(req,res)=>{
 try{const d=await access(req.params.id,req.user);if(!d||(d.permission!=="owner"&&req.user.role!=="admin"))return res.status(403).json({message:"Only the owner can delete this document."});await pool.query("DELETE FROM documents WHERE id=$1",[d.id]);fs.unlink(path.join(folder,d.stored_name),()=>{});await audit(req.user.id,"DELETE","Deleted "+d.original_name);res.json({message:"Document deleted."});}
 catch(e){console.error(e.message);res.status(500).json({message:"Could not delete document."});}
});
module.exports=router;
