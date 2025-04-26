document.addEventListener("DOMContentLoaded", function () {
    const uploadForm = document.getElementById("uploadForm");
    const feedback = document.getElementById("feedback");

    // Handle form submission
    uploadForm.addEventListener("submit", function (event) {
        event.preventDefault(); // Prevent the default form submission behavior

        // Show feedback message
        feedback.innerHTML = "Uploading and processing your image...";

        // Submit the form
        const formData = new FormData(uploadForm);
        fetch("/upload", {
            method: "POST",
            body: formData,
        })
            .then((response) => {
                if (response.ok) {
                    return response.blob(); // Sticker file as a blob
                } else {
                    throw new Error("Failed to process image.");
                }
            })
            .then((blob) => {
                // Create a download link for the sticker
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "sticker.png"; // Set filename for download
                a.click(); // Trigger download

                feedback.innerHTML = "Sticker successfully processed!";
            })
            .catch((error) => {
                console.error(error);
                feedback.innerHTML = "Error processing your image. Please try again.";
            });
    });
});