chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Received Request:", request); 

    const { videoUrl, selectedQuality } = request;

    if (!videoUrl || videoUrl === "undefined") {
        console.error("Invalid video URL received:", videoUrl);
        chrome.runtime.sendMessage({ status: "error", msg: "Invalid video URL!" });
        return;
    }

    if (!selectedQuality || selectedQuality === "undefined") {
        console.error("Invalid quality received:", selectedQuality);
        chrome.runtime.sendMessage({ status: "error", msg: "Invalid quality selection!" });
        return;
    }

    
    let qualityOption = "";
    let isAudioOnly = false;
    
    switch (selectedQuality) {
        case "144p":
            qualityOption = "-f \"bestvideo[height<=144]+bestaudio/best\"";
            break;
        case "240p":
            qualityOption = "-f \"bestvideo[height<=240]+bestaudio/best\"";
            break;
        case "360p":
            qualityOption = "-f \"bestvideo[height<=360]+bestaudio/best\"";
            break;
        case "480p":
            qualityOption = "-f \"bestvideo[height<=480]+bestaudio/best\"";
            break;
        case "1440p":
            qualityOption = "-f \"bestvideo[height<=1440]+bestaudio/best\"";
            break;
        case "2160p":
            qualityOption = "-f \"bestvideo[height<=2160]+bestaudio/best\"";
            break;
        case "720p":
            qualityOption = "-f \"bestvideo[height<=720]+bestaudio/best\""; 
            break;
        case "1080p":
            qualityOption = "-f \"bestvideo[height<=1080]+bestaudio/best\""; 
            break;
        case "audio":
            qualityOption = "--extract-audio --audio-format mp3"; 
            isAudioOnly = true;
            break;
        case "worst":
            qualityOption = "-f worst";
            break;
        case "best":
        default:
            qualityOption = "-f bestvideo+bestaudio/best";
            break;
    }

    console.log("Sending Download Request:", { videoUrl, qualityOption, isAudioOnly });

    
    fetch("http://localhost:5000/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: videoUrl, qualityOption, selectedQuality, isAudioOnly }) 
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(errData => {
                throw new Error(errData.error || `Server error: ${response.status} ${response.statusText}`);
            }).catch(() => {
                throw new Error(`Server error: ${response.status} ${response.statusText}`);
            });
        }
        return response.json(); 
    })
    .then(data => {
        console.log("Download Success Response:", data);
        chrome.runtime.sendMessage({
            status: "success",
            msg: data.message || "Download started successfully!" 
        });
    })
    .catch(error => {
        console.error("Download failed:", error);
        chrome.runtime.sendMessage({
            status: "error",
            msg: error.message || "An unexpected error occurred. Check server logs." 
        });
    });
});
