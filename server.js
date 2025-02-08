const express = require("express");
const { exec } = require("child_process");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(cors());

app.post("/download", (req, res) => {
    const { url, qualityOption, selectedQuality, isAudioOnly } = req.body;

    console.log("Received download request:");
    console.log("URL:", url);
    console.log("Quality Option:", qualityOption);
    console.log("Selected Quality:", selectedQuality);
    console.log("Is Audio Only:", isAudioOnly);

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
    if (selectedQuality === "720p") {
        correctQualityOption = `-f "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best"`;
    }
    if (selectedQuality === "1080p") {
        correctQualityOption = `-f "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best"`;
    }
    if (isAudioOnly) {
        correctQualityOption = `-f "bestaudio[ext=m4a]/best" --audio-format mp3`;
        fileName = `downloads/%(title)s-${selectedQuality}.mp3`;
    }

    const finalCommand = `python -m yt_dlp ${correctQualityOption} -o "${fileName}" --merge-output-format mp4 "${url}"`;

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
