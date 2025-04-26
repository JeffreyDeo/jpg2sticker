const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const { promisify } = require("util");
const unlinkAsync = promisify(fs.unlink);

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure the "uploads" and "processed" folders exist
const uploadDir = "./uploads";
const processedDir = "./processed";
[uploadDir, processedDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
});

// Configure Multer for file uploads with size limit and file type validation
const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        // Create unique filenames with original extension
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1000)}${path.extname(file.originalname)}`);
    },
});

const fileFilter = (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({ 
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB max file size
});

// Serve static frontend files
app.use(express.static("public"));

// Upload Route for JPG-to-Sticker Conversion
app.post("/upload", upload.single("image"), async (req, res) => {
    let originalFilePath = null;
    let processedFilePath = null;
    
    try {
        if (!req.file) {
            return res.status(400).send("No image file uploaded.");
        }
        
        originalFilePath = req.file.path;
        const timestamp = Date.now();
        processedFilePath = `${processedDir}/sticker-${timestamp}.png`;
        
        // Get image metadata to determine dimensions
        const metadata = await sharp(originalFilePath).metadata();
        
        // Step 1: Create a transparent background PNG from the original
        // (Note: This doesn't actually remove background - for that you'd need ML libraries)
        // Create a semi-transparent version for demonstration
        let pipeline = sharp(originalFilePath)
            .png()
            .ensureAlpha();
            
        // Step 2: Add an outline effect
        // Create a mask with alpha channel for outline effect
        const outlineWidth = Math.max(3, Math.round(Math.min(metadata.width, metadata.height) / 100));
        
        // Create a composite that simulates an outline effect
        await pipeline
            .composite([{
                input: Buffer.from(`
                    <svg>
                        <filter id="outline">
                            <feMorphology operator="dilate" radius="${outlineWidth}"/>
                        </filter>
                        <image width="100%" height="100%" href="data:image/png;base64,${
                            (await sharp(originalFilePath)
                                .ensureAlpha()
                                .toBuffer())
                                .toString('base64')
                        }" filter="url(#outline)"/>
                    </svg>`
                ),
                blend: 'over'
            }])
            .toFile(processedFilePath);
            
        // Return the processed image
        res.download(processedFilePath, "sticker.png", async () => {
            console.log("Sticker file sent to client.");
            
            // Clean up files after sending
            try {
                await unlinkAsync(originalFilePath);
                // Wait a bit before deleting the processed file to ensure it's fully sent
                setTimeout(async () => {
                    try {
                        await unlinkAsync(processedFilePath);
                    } catch (err) {
                        console.error("Error deleting processed file:", err);
                    }
                }, 5000);
            } catch (err) {
                console.error("Error cleaning up files:", err);
            }
        });
    } catch (error) {
        console.error("Error processing image:", error);
        
        // Clean up any created files
        if (originalFilePath && fs.existsSync(originalFilePath)) {
            try {
                await unlinkAsync(originalFilePath);
            } catch (cleanupErr) {
                console.error("Error cleaning up original file:", cleanupErr);
            }
        }
        
        if (processedFilePath && fs.existsSync(processedFilePath)) {
            try {
                await unlinkAsync(processedFilePath);
            } catch (cleanupErr) {
                console.error("Error cleaning up processed file:", cleanupErr);
            }
        }
        
        // Send appropriate error message
        if (error.message.includes('limit')) {
            return res.status(413).send("Image file too large. Maximum size is 10MB.");
        }
        res.status(500).send("Failed to process image. " + error.message);
    }
});

// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).send("Service is running");
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke! ' + (err.message || ''));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});