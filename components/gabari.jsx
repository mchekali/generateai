import express from "express";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import fs from "fs";
import cookieParser from "cookie-parser";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import qaRoutes from "./routes/qaRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js"; // Import the new upload route

dotenv.config();

const port = process.env.PORT || 3000;

connectDB();

const app = express();

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  }),
);
app.use(cookieParser());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "https://localhost");
  next();
});

// CORS middleware
app.use((req, res, next) => {
  const allowedOrigins = ["https://www.remedeasy.com", "https://localhost"];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );
  res.setHeader("Access-Control-Allow-Credentials", true);

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

app.use("/node/users", userRoutes);
app.use("/node/qa", qaRoutes);
app.use("/node/upload", uploadRoutes); // Use the new upload route

app.get("/", (req, res) => res.send("Server is running"));

// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname),
    );
  },
});

const upload = multer({ storage: storage });

// Upload endpoint
app.post("/node/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  const publicImageUrl = `https://www.remedeasy.com/uploads/${req.file.filename}`;
  res.status(200).json({ imageUrl: publicImageUrl });
});

app.use(notFound);
app.use(errorHandler);

app.listen(port, () => console.log(`Server is running on port ${port}`));
