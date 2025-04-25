const express = require("express");
const multer = require("multer"); // For file uploads
const sharp = require("sharp");  // For image processing
const path = require("path");

const app = express();
const PORT = 3000;

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: "./uploads",
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    },
});
const upload = multer({ storage });

// Serve static files (frontend)
app.use(express.static("public")); // "public" folder holds frontend files

// Upload Route
app.post("/upload", upload.single("image"), async (req, res) => {
    try {
        const filePath = req.file.path; // Path of the uploaded file
        const outputPath = `./uploads/sticker-${Date.now()}.png`; // Output sticker path

        // Process image (make background transparent)
        await sharp(filePath)
            .png() // Convert to PNG
            .removeAlpha() // Remove background logic (basic example)
            .toFile(outputPath);

        // Send the processed sticker file back
        res.download(outputPath, "sticker.png", () => {
            console.log("Sticker file sent to client.");
        });
    } catch (error) {
        console.error("Error processing image:", error);
        res.status(500).send("Failed to process image.");
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});