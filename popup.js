document.getElementById("downloadBtn").addEventListener("click", async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    
    const selectedQuality = document.getElementById("qualitySelect").value;

    
    const button = document.getElementById("downloadBtn");
    button.classList.add("loading");
    document.getElementById("loadingSpinner").style.display = "block";
    document.getElementById("message").textContent = "";
    document.getElementById("message").style.opacity = 0;

    
    chrome.runtime.sendMessage({
        videoUrl: tab.url,  
        selectedQuality: selectedQuality
    }, (response) => {
        if (chrome.runtime.lastError) {
            console.error("Error sending message to background:", chrome.runtime.lastError);
        }
    });
});



function getVideoUrl(selectedQuality) {
    let videoUrl = window.location.href;
    chrome.runtime.sendMessage({ videoUrl, selectedQuality }); 
}


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
