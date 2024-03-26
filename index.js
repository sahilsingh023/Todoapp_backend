var express = require("express");
var MongoClient = require("mongodb").MongoClient; 
var cors = require("cors");
const multer = require("multer");
const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");
const jsonwebtoken = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");

var app = express();
app.use(cors());

var CONNECTION_STRING =
  "mongodb+srv://sahilsingh023212:7236004388@cluster0.dnxuac0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

var DATABASENAME = "todoappdb";
var database;

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later"
});

app.use(limiter);

app.listen(5038, () => {
  MongoClient.connect(CONNECTION_STRING, (error, client) => { 
    database = client.db(DATABASENAME);
    console.log("mongo DB connection successful");
  });
});

// signup

app.post('/api/todoapp/signup', multer().none(), (req, res) => {
  const { name, email, password } = req.body;

   
   database.collection("users").findOne({ email: email }, (err, user) => {
    if (err) {
      return res.status(500).json({
        error: err
      });
    }
    
    if (user) {
      return res.status(409).json({
        message: "Email already exists"
      });
    }

    bcryptjs.hash(password, 10, (err, hash) => {
      if (err) {
        return res.status(500).json({
          error: err
        });
      }

       
       database.collection("users").insertOne({
        name: name,
        email: email,
        password: hash
      }, (err, result) => {
        if (err) {
          return res.status(500).json({
            error: err
          });
        }
        
        res.status(201).json({
          message: "User created successfully"
        });
      });
    });
  });
});

// login

app.post('/api/todoapp/login', (req, res) => {
  const { email, password } = req.body;

  database.collection("users").findOne({ email: email }, (err, user) => {
    if (err) {
      return res.status(500).json({
        error: err
      });
    }
    
    if (!user) {
      return res.status(401).json({
        message: "Authentication failed"
      });
    }

    bcryptjs.compare(password, user.password, (err, result) => {
      if (err || !result) {
        return res.status(401).json({
          message: "Authentication failed"
        });
      }
      
      
      const token = jsonwebtoken.sign(
        {
          email: user.email,
          userId: user._id
        },
        "Sahil", 
        {
          expiresIn: "1h"
        }
      );
      
      res.status(200).json({
        message: "Login successful",
        token: token
      });
    });
  });
});

// CRUD API

app.get('/api/todoapp/GetNotes', (req, res) => { 
  database.collection("todoappcollection").find({}).toArray((error, result) => {
    res.send(result); 
  });
});

app.post('/api/todoapp/AddNotes',multer().none(),(req, res)=>{
  console.log("connected");
  database.collection("todoappcollection").count({},function(error,numofDocs){
    database.collection("todoappcollection").insertOne({
      id:(numofDocs+1).toString(),
      description:req.body?.newNotes ? req.body?.newNotes : ""
    });
    res.json("Added Succesfully");
  });
});

app.delete('/api/todoapp/DeleteNotes',(req, res)=>{
  database.collection("todoappcollection").deleteOne({
    id:req.query.id
  });
  res.json("Delete Successfully");
});

