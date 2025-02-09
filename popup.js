document.getElementById("downloadBtn").addEventListener("click", async () => {
    try {
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) {
            throw new Error("No active tab found");
        }

        const selectedQuality = document.getElementById("qualitySelect").value;
        const button = document.getElementById("downloadBtn");
        
        const spinner = document.getElementById("loadingSpinner");
        const messageElement = document.getElementById("message");

        button.classList.add("loading");
        spinner.style.display = "block";
        messageElement.textContent = "";
        messageElement.style.opacity = 0;

        chrome.runtime.sendMessage({
            videoUrl: tab.url,
            selectedQuality: selectedQuality
        });
    } catch (error) {
        showErrorMessage("Failed to start download: " + error.message);
    }
});

chrome.runtime.onMessage.addListener((message) => {
    const { status, msg } = message;
    const spinner = document.getElementById("loadingSpinner");
    const messageElement = document.getElementById("message");
    const button = document.getElementById("downloadBtn");

    spinner.style.display = "none";
    button.classList.remove("loading");

    setTimeout(() => {
        if (status) {
            messageElement.style.opacity = 1;
            messageElement.textContent = msg || (status === "success" ? "Download started!" : "Something went wrong.");
            if (status === "success") {
                messageElement.classList.add("success");
                messageElement.classList.remove("error");
            } else {
                messageElement.classList.add("error");
                messageElement.classList.remove("success");
            }
        }
    }, 1500);
});
