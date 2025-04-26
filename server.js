const express = require("express");
const multer = require("multer"); // For handling file uploads
const sharp = require("sharp");  // For processing images
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure the "uploads" folder exists
const uploadDir = "./uploads";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir); // Create uploads directory if it doesn't exist
}

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Create unique filenames
    },
});
const upload = multer({ storage });

// Serve static frontend files from the "public" folder
app.use(express.static("public"));

// Upload Route for JPG-to-Sticker Conversion
app.post("/upload", upload.single("image"), async (req, res) => {
    try {
        const filePath = req.file.path; // Path of the uploaded file
        const outputPath = `./uploads/sticker-${Date.now()}.png`; // Path for the output sticker

        // Use sharp to process the image (convert it to PNG and remove the background)
        await sharp(filePath)
            .png() // Convert to PNG format
            .removeAlpha() // Simplified for now; you can use other options for background removal
            .toFile(outputPath);

        // Send the processed sticker back as a downloadable file
        res.download(outputPath, "sticker.png", () => {
            console.log("Sticker file sent to client.");
        });
    } catch (error) {
        console.error("Error processing image:", error);
        res.status(500).send("Failed to process image.");
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});