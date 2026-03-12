require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectToMongo = require('./config/db');

const app = express();

connectToMongo();

// Middleware
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://gallery-frontend-amber.vercel.app"
  ],
  methods: ["GET","POST","PUT","DELETE"],
  credentials: true
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Gallery Backend API Running 🚀");
});

//Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/images", require("./routes/images"));

//static folder for images
app.use("/uploads", express.static("uploads"));

app.listen(5000 , ()=> console.log("server is running on 5000"));


