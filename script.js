document.addEventListener("DOMContentLoaded", function () {
    const jpgInput = document.getElementById("jpg-upload");
    const previewSection = document.getElementById("preview-section");
    const convertButton = document.getElementById("convert-button");

    let uploadedImage = null;

    // Event listener for JPG upload
    jpgInput.addEventListener("change", function (event) {
        const file = event.target.files[0];
        console.log("JPG file uploaded:", file);

        if (file && file.type === "image/jpeg") {
            convertButton.disabled = false; // Enable the button
            console.log("Convert button enabled.");

            const imgUrl = URL.createObjectURL(file);

            // Show preview
            previewSection.innerHTML = `<p>Uploaded Image:</p><img src="${imgUrl}" alt="JPG preview" class="frame-preview">`;

            // Store the uploaded image for processing
            uploadedImage = new Image();
            uploadedImage.src = imgUrl;
        } else {
            alert("Please upload a valid JPG file.");
            convertButton.disabled = true;
        }
    });

    // Event listener for "Convert to Sticker" button
    convertButton.addEventListener("click", function () {
        console.log("Converting JPG to sticker...");

        if (uploadedImage) {
            convertToSticker(uploadedImage);
        } else {
            alert("No valid image to process.");
        }
    });

    // Convert JPG to sticker
    function convertToSticker(image) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Set canvas size to match the image
        canvas.width = image.width;
        canvas.height = image.height;

        // Draw image on canvas
        ctx.drawImage(image, 0, 0);

        // Get image data for background removal
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Detect bright pixels (e.g., white or light background)
            if (r + g + b > 600) {
                data[i + 3] = 0; // Set alpha channel to 0 (transparent)
            }
        }

        // Put modified image data back on canvas
        ctx.putImageData(imageData, 0, 0);

        // Export as PNG
        const stickerUrl = canvas.toDataURL("image/png");
        console.log("Sticker created:", stickerUrl);

        // Directly download the sticker
        const link = document.createElement("a");
        link.href = stickerUrl;
        link.download = "sticker.png";
        link.click();

        // Update UI: Disable "Convert to Sticker" button and clear preview
        convertButton.disabled = true;
        previewSection.innerHTML = "<p>Sticker successfully downloaded!</p>";
    }
});