const express = require("express");
const { exec } = require("child_process");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(cors());

// --- Playlist Details Cache ---
const playlistCache = {};
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour
// -----------------------------

// --- Download Queue Settings ---
const downloadQueue = [];
let activeDownloads = 0;
const MAX_CONCURRENT_DOWNLOADS = 3; // Limit to 3 concurrent yt-dlp processes
// -----------------------------

// --- Ensure downloads directory exists on startup ---
const downloadsDir = "downloads";
if (!fs.existsSync(downloadsDir)) {
    try {
        fs.mkdirSync(downloadsDir);
        console.log(`Created directory: ${downloadsDir}`);
    } catch (err) {
        console.error(`Error creating directory ${downloadsDir}:`, err);
        // Decide if you want to exit if the directory can't be created
        // process.exit(1);
    }
}
// --------------------------------------------------

app.post("/download", (req, res) => {
    const { url, qualityOption, selectedQuality, isAudioOnly, downloadType } = req.body;

    console.log("Received download request:");
    console.log("URL:", url);
    console.log("Quality Option:", qualityOption);
    console.log("Selected Quality:", selectedQuality);
    console.log("Is Audio Only:", isAudioOnly);
    console.log("Download Type:", downloadType);

    if (!url || url === "undefined") {
        console.error("Invalid video URL received:", url);
        return res.status(400).json({ error: "Invalid video URL received" });
    }

    if (!qualityOption || qualityOption === "undefined") {
        console.error("Invalid quality option received:", qualityOption);
        return res.status(400).json({ error: "Invalid quality option received" });
    }

    // --- Prepare Download Job --- 
    let fileName = `${downloadsDir}/%(title)s-${selectedQuality}.mp4`;
    let correctQualityOption = qualityOption;
    switch (selectedQuality) {
        case "144p":
            correctQualityOption = `-f "bestvideo[height<=144][ext=mp4]+bestaudio[ext=m4a]/best"`;
            break;
        case "240p":
            correctQualityOption = `-f "bestvideo[height<=240][ext=mp4]+bestaudio[ext=m4a]/best"`;
            break;
        case "360p":
            correctQualityOption = `-f "bestvideo[height<=360][ext=mp4]+bestaudio[ext=m4a]/best"`;
            break;
        case "480p":
            correctQualityOption = `-f "bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best"`;
            break;
        case "720p":
            correctQualityOption = `-f "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best"`;
            break;
        case "1080p":
            correctQualityOption = `-f "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best"`;
            break;
        case "1440p":
            correctQualityOption = `-f "bestvideo[height<=1440][ext=mp4]+bestaudio[ext=m4a]/best"`;
            break;
        case "2160p":
            correctQualityOption = `-f "bestvideo[height<=2160][ext=mp4]+bestaudio[ext=m4a]/best"`;
            break;
    }
    
    if (isAudioOnly) {
        correctQualityOption = `-f "bestaudio[ext=m4a]/best" --audio-format mp3`;
        fileName = `${downloadsDir}/%(title)s-${selectedQuality}.mp3`;
    }

    let commandFlags = correctQualityOption;
    if (downloadType === 'single') {
        commandFlags += " --no-playlist";
    }

    const finalCommand = `python -m yt_dlp ${commandFlags} -o "${fileName}" --merge-output-format mp4 "${url}"`;
    // --------------------------

    // --- Add job to queue ---
    downloadQueue.push({ command: finalCommand, response: res });
    console.log(`Added job to queue. Queue size: ${downloadQueue.length}`);
    processQueue(); // Attempt to process the queue
    // ------------------------

    // Don't send response here yet, it will be sent when the job finishes or errors
});

// --- Queue Processing Function ---
function processQueue() {
    console.log(`Checking queue: Active=${activeDownloads}, Queue size=${downloadQueue.length}`);
    if (activeDownloads >= MAX_CONCURRENT_DOWNLOADS || downloadQueue.length === 0) {
        // Max concurrency reached or queue is empty
        return; 
    }

    activeDownloads++;
    const job = downloadQueue.shift(); // Get the next job
    console.log(`Starting job. Active=${activeDownloads}, Queue size=${downloadQueue.length}`);
    console.log("Executing command:", job.command);

    exec(job.command, { shell: true }, (error, stdout, stderr) => {
        activeDownloads--;
        console.log(`Job finished. Active=${activeDownloads}, Queue size=${downloadQueue.length}`);
        
        if (error) {
            console.error("Error:", stderr);
            // Send error response for this specific job
            if (!job.response.headersSent) {
                 job.response.status(500).json({ error: stderr });
            }
        } else {
            console.log("Download Success:", stdout);
            // Send success response for this specific job
             if (!job.response.headersSent) {
                 job.response.json({ message: "Download completed successfully!" }); // Changed message
             }
        }
        
        // Try to process the next item in the queue
        processQueue(); 
    });
}
// -----------------------------

app.get("/playlist-details", (req, res) => {
    const { url } = req.query;
    let playlistId = null;

    if (url && url.includes("list=")) {
        try {
            const urlParams = new URLSearchParams(new URL(url).search);
            playlistId = urlParams.get("list");
        } catch (e) {
            console.error("Error parsing URL to get playlist ID:", e);
            return res.status(400).json({ error: "Invalid playlist URL format" });
        }
    }

    if (!playlistId) {
        return res.status(400).json({ error: "Could not extract playlist ID from URL" });
    }

    // --- Check Cache using Playlist ID as key ---
    const now = Date.now();
    if (playlistCache[playlistId] && (now - playlistCache[playlistId].timestamp < CACHE_DURATION_MS)) {
        console.log(`Cache HIT for playlist details (ID: ${playlistId}): ${url}`);
        return res.json({ title: playlistCache[playlistId].title });
    }
    console.log(`Cache MISS for playlist details (ID: ${playlistId}): ${url}`);
    // ---------------------------------------------

    // Pass the original URL to yt-dlp, but use playlistId for caching
    const command = `python -m yt_dlp --flat-playlist --dump-single-json "${url}"`;
    console.log("Executing command for playlist details:", command);

    exec(command, { shell: true, maxBuffer: 1024 * 1024 * 5 }, (error, stdout, stderr) => { 
        if (error) {
            console.error("Error getting playlist details:", stderr);
            return res.status(500).json({ error: `Failed to get playlist details: ${stderr}` });
        }
        try {
            const data = JSON.parse(stdout);
            const playlistTitle = data.title || "Playlist Title Not Found";
            console.log("Playlist Details Found:", playlistTitle);
            
            // --- Store in Cache using Playlist ID as key ---
            playlistCache[playlistId] = { title: playlistTitle, timestamp: Date.now() };
            // -----------------------------------------------

            res.json({ title: playlistTitle });
        } catch (parseError) {
            console.error("Error parsing playlist details JSON:", parseError, "\nStdout:", stdout);
            res.status(500).json({ error: "Failed to parse playlist details" });
        }
    });
});

app.listen(5000, () => console.log("Server running on port 5000"));
