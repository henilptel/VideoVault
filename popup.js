const elements = {
    downloadBtn: document.getElementById("downloadBtn"),
    qualitySelect: document.getElementById("qualitySelect"),
    spinner: document.getElementById("loadingSpinner"),
    messageElement: document.getElementById("message"),
    playlistOptionsDiv: document.getElementById("playlistOptions"),
    videoTitleElement: document.getElementById("videoTitle"),
    thumbnailElement: document.getElementById("thumbnail")
};

function isValidYouTubeUrl(url) {
    return url && url.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/);
}

function isYouTubePlaylistUrl(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.includes('youtube.com') && urlObj.searchParams.has('list');
    } catch (e) {
        return false;
    }
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
    resetUI(); 
    try {
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url) {
            if (isYouTubePlaylistUrl(tab.url)) {
                elements.playlistOptionsDiv.style.display = "block";
            }
            await getVideoDetails(tab.url);
        } else {
            showErrorMessage("Could not get active tab information.");
        }
    } catch (error) {
        showErrorMessage("Error initializing popup: " + error.message);
    }
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

        let downloadType = "single"; 
        if (elements.playlistOptionsDiv.style.display === "block") {
            const selectedRadio = document.querySelector('input[name="playlistChoice"]:checked');
            if (selectedRadio) {
                downloadType = selectedRadio.value; 
            }
        }

        chrome.runtime.sendMessage({
            videoUrl: tab.url,
            selectedQuality: selectedQuality,
            downloadType: downloadType 
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
    }, 100);
});

document.addEventListener("DOMContentLoaded", () => {
    resetUI(); 
});