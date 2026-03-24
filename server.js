require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const Razorpay = require("razorpay");
const cors = require("cors");
const crypto = require("crypto");

const User = require("./models/User");
const Product = require("./models/Product");
const Order = require("./models/Order");
const auth = require("./middleware/auth");

const app = express();
app.use(express.json());
app.use(cors());

// DB
mongoose.connect(process.env.MONGO_URL)
.then(()=>console.log("MongoDB connected"))
.catch(err=>console.log(err));

// Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET
});


// ================= AUTH =================

// Register
app.post("/register", async (req,res)=>{
  const bcrypt = require("bcryptjs");
  const hash = await bcrypt.hash(req.body.password,10);

  const user = await User.create({
    email: req.body.email,
    password: hash
  });

  res.json(user);
});

// Login
app.post("/login", async (req,res)=>{
  const bcrypt = require("bcryptjs");
  const jwt = require("jsonwebtoken");

  const user = await User.findOne({email:req.body.email});
  if(!user) return res.status(400).json({msg:"User not found"});

  const valid = await bcrypt.compare(req.body.password,user.password);
  if(!valid) return res.status(400).json({msg:"Invalid password"});

  const token = jwt.sign({id:user._id}, process.env.JWT_SECRET);
  res.json({token});
});


// ================= PRODUCTS =================

// Add product (admin)
app.post("/add-product", auth, async (req,res)=>{
  const product = await Product.create(req.body);
  res.json(product);
});

// Get all products
app.get("/products", async (req,res)=>{
  const products = await Product.find();
  res.json(products);
});


// ================= PAYMENT =================

// Create order
app.post("/create-order", async (req,res)=>{
  const {amount} = req.body;

  const order = await razorpay.orders.create({
    amount: amount * 100,
    currency: "INR"
  });

  res.json(order);
});

// Verify payment
app.post("/verify", async (req,res)=>{
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(body)
    .digest("hex");

  if(expected === razorpay_signature){
    
    await Order.create({
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      status: "paid"
    });

    res.json({status:"success"});
  } else {
    res.status(400).json({status:"failed"});
  }
});


// ================= SERVER =================

app.listen(process.env.PORT, ()=>{
  console.log("Server running on port " + process.env.PORT);
});
