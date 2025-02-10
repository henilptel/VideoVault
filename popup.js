
const elements = {
    downloadBtn: document.getElementById("downloadBtn"),
    qualitySelect: document.getElementById("qualitySelect"),
    spinner: document.getElementById("loadingSpinner"),
    messageElement: document.getElementById("message")
};

function isValidYouTubeUrl(url) {
    return url && url.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/);
}

function showMessage(message, isSuccess) {
    elements.messageElement.style.opacity = 1;
    elements.messageElement.textContent = message;
    elements.messageElement.classList.toggle("success", isSuccess);
    elements.messageElement.classList.toggle("error", !isSuccess);
}

function showErrorMessage(message) {
    showMessage(message, false);
}

function resetUI() {
    elements.spinner.style.display = "none";
    elements.downloadBtn.classList.remove("loading");
    elements.messageElement.textContent = "";
    elements.messageElement.style.opacity = 0;
    elements.messageElement.classList.remove("success", "error");
}

function setLoadingState() {
    elements.downloadBtn.classList.add("loading");
    elements.spinner.style.display = "block";
    elements.messageElement.textContent = "";
    elements.messageElement.style.opacity = 0;
}

async function getVideoDetails(videoUrl) {
    const videoId = new URL(videoUrl).searchParams.get("v");
    if (!videoId) return;

    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    const thumbnail = document.getElementById("thumbnail");
    
    thumbnail.src = thumbnailUrl;
    
    thumbnail.onerror = () => {
        thumbnail.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    };

    const apiUrl = `https://noembed.com/embed?url=${videoUrl}`;
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        document.getElementById("videoTitle").textContent = data.title || "Unknown Title";
    } catch (error) {
        document.getElementById("videoTitle").textContent = "Error fetching title";
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await getVideoDetails(tab.url);
});


elements.downloadBtn.addEventListener("click", async () => {
    try {
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) {
            throw new Error("No active tab found");
        }

        if (!isValidYouTubeUrl(tab.url)) {
            throw new Error("Not a valid YouTube URL");
        }

        const selectedQuality = elements.qualitySelect.value;
        setLoadingState();

        chrome.runtime.sendMessage({
            videoUrl: tab.url,
            selectedQuality: selectedQuality
        });
    } catch (error) {
        showErrorMessage(`Failed to start download: ${error.message}`);
        resetUI();
    }
});

chrome.runtime.onMessage.addListener((message) => {
    const { status, msg } = message;
    
    resetUI();

    if (!status) {
        return;
    }

    setTimeout(() => {
        const isSuccess = status === "success";
        const displayMessage = msg || (isSuccess ? "Download started!" : "Something went wrong.");
        showMessage(displayMessage, isSuccess);
    }, 1500);
});

document.addEventListener("DOMContentLoaded", resetUI);