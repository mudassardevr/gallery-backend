require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectToMongo = require('./config/db');

const app = express();

connectToMongo();

// Middleware
app.use(cors());
app.use(express.json());

//Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/images", require("./routes/images"));

//static folder for images
app.use("/uploads", express.static("uploads"));

app.listen(5000 , ()=> console.log("server is running on 5000"));


