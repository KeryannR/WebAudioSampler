import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, "../public")));
app.use("/presets", express.static(path.join(__dirname, "presets")));

//endpoint pour lister les presets
app.get("/api/presets", (req, res) => {
    const presetsDir = path.join(__dirname, "presets");
    const files = fs.readdirSync(presetsDir).filter(f => f.endsWith(".json"));

    const presets = files.map(f => {
        const data = JSON.parse(fs.readFileSync(path.join(presetsDir, f), "utf-8"));
        return { name: data.name, type: data.type, isFactoryPresets: data.isFactoryPresets };
    });

    res.json(presets);
});

//endpoint pour récupérer un preset précis
app.get("/api/presets/:name", (req, res) => {
    const name = req.params.name;
    const jsonPath = path.join(__dirname, "presets", `${name}.json`);

    if (!fs.existsSync(jsonPath)) {
        console.error("Preset not found:", jsonPath);
        return res.status(404).send("Preset not found");
    }

    const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    res.json(data);
});

//lancement du serveur
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
