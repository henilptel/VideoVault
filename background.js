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
    switch (selectedQuality) {
        case "720p":
            qualityOption = "-f bestvideo[height<=720]+bestaudio/best";
            break;
        case "1080p":
            qualityOption = "-f bestvideo[height<=1080]+bestaudio/best";
            break;
        case "audio":
            qualityOption = "-f bestaudio";
            break;
        case "worst":
            qualityOption = "-f worst";
            break;
        case "best":
        default:
            qualityOption = "-f best";
            break;
    }

    console.log("Sending Download Request:", { videoUrl, qualityOption });

    
    fetch("http://localhost:5000/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: videoUrl, qualityOption }) 
    })
    .then(response => response.json())
    .then(data => {
        console.log("Download started!", data);
        chrome.runtime.sendMessage({
            status: "success",
            msg: "Download started successfully!"
        });
    })
    .catch(error => {
        console.error("Download failed", error);
        chrome.runtime.sendMessage({
            status: "error",
            msg: "Something went wrong. Please try again."
        });
    });
});
