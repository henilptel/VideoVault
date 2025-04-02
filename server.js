const express = require("express");
const { exec } = require("child_process");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(cors());

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

    if (!fs.existsSync("downloads")) {
        fs.mkdirSync("downloads");
    }

    let fileName = `downloads/%(title)s-${selectedQuality}.mp4`;

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
        fileName = `downloads/%(title)s-${selectedQuality}.mp3`;
    }

    let commandFlags = correctQualityOption;
    if (downloadType === 'single') {
        commandFlags += " --no-playlist";
    }

    const finalCommand = `python -m yt_dlp ${commandFlags} -o "${fileName}" --merge-output-format mp4 "${url}"`;

    console.log("Executing command:", finalCommand);

    exec(finalCommand, { shell: true }, (error, stdout, stderr) => {
        if (error) {
            console.error("Error:", stderr);
            return res.status(500).json({ error: stderr });
        }
        console.log("Download Success:", stdout);
        res.json({ message: "Download started!" });
    });
});

app.listen(5000, () => console.log("Server running on port 5000"));
