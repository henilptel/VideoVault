const express = require("express");
const { exec } = require("child_process");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

app.post("/download", (req, res) => {
    const { url, qualityOption } = req.body;

    console.log("Received download request:");
    console.log("URL:", url);
    console.log("Quality:", qualityOption);

    
    if (!url || url === "undefined") {
        console.error("Invalid video URL received:", url);
        return res.status(400).json({ error: "Invalid video URL received" });
    }

    if (!qualityOption || qualityOption === "undefined") {
        console.error("Invalid quality option received:", qualityOption);
        return res.status(400).json({ error: "Invalid quality option received" });
    }

    
    const command = `python -m yt_dlp ${qualityOption} -o "downloads/%(title)s.%(ext)s" "${url}"`;

    console.log("Executing command:", command);

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error("Error:", stderr);
            return res.status(500).json({ error: "Download failed" });
        }
        console.log("Download Success:", stdout);
        res.json({ message: "Download started!" });
    });
});

app.listen(5000, () => console.log("Server running on port 5000"));
