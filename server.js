const express = require("express");
const mongoose = require("mongoose");
const Razorpay = require("razorpay");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://127.0.0.1:27017/ecom");

const Product = require("./models/Product");
const Order = require("./models/Order");

const razorpay = new Razorpay({
  key_id: "YOUR_KEY",
  key_secret: "YOUR_SECRET"
});

app.get("/products", async (req,res)=>{
  const products = await Product.find();
  res.json(products);
});

app.post("/create-order", async (req,res)=>{
  const order = await razorpay.orders.create({
    amount: req.body.amount * 100,
    currency: "INR"
  });
  res.json(order);
});

app.post("/verify", async (req,res)=>{
  const {razorpay_order_id, razorpay_payment_id, razorpay_signature} = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expected = crypto
    .createHmac("sha256", "YOUR_SECRET")
    .update(body)
    .digest("hex");

  if(expected === razorpay_signature){
    await Order.create({payment_id: razorpay_payment_id});
    res.send("Verified");
  } else {
    res.send("Failed");
  }
});

app.listen(3000, ()=>console.log("Server running"));