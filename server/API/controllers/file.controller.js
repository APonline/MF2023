/* eslint-disable no-console */
const uploadFile = require("../middleware/upload");
const fs = require("fs");
const sharp = require("sharp");

// If you also use ffmpeg elsewhere in this file:
let ffmpeg;
try { ffmpeg = require("fluent-ffmpeg"); } catch (_) { /* optional */ }

const videoTypes = ["mov", "mp4", "avi", "mpeg"];
const audioTypes = ["mp3", "wav"];
const documentTypes = ["pdf", "word", "xlsx", "csv", "xls"];
const imagesTypes = ["jpg", "jpeg", "JPG", "png", "gif", "tiff", "svg"];

// Keep basedir from the server bootstrap
const __basedir = global.__basedir;

// Small helper so we never crash if res.locals.baseUrl is missing
function getReqBaseUrl(req, res) {
    return (res && res.locals && res.locals.baseUrl) ? res.locals.baseUrl : "https://musefactory.app";
}

const upload = async (req, res) => {
    try {
        await new Promise((resolve, reject) => {
            uploadFile(req, res, (err) => (err ? reject(err) : resolve()));
        });

        if (!req) {
            return res.status(400).send({ message: "Please upload a file!" });
        }

        res.status(200).send({ message: "Uploaded the file successfully." });
    } catch (err) {
        res.status(500).send({ message: `Could not upload the file. ${err}` });
    }
};

const getListFiles = (req, res) => {
    const p = req.params.name;
    const g = req.query.group;
    const t = getfileFormat(req.query.type);
    const directoryPath = `${__basedir}/resources/static/${g}/${t}/`;
    const baseUrl = getReqBaseUrl(req, res);

    fs.readdir(directoryPath, async (err, files) => {
        if (err) {
            return res.status(500).send({ message: "Unable to scan files!" });
        }

        // remove junk
        const clean = (files || []).filter((f) => f && f !== ".DS_Store");

        const fileInfos = await Promise.all(
            clean.map(async (file) => {
                const f = await getFileType(file, g, t);
                return {
                    name: file,
                    url: `${baseUrl}/api/v1/files/${file}`,
                    type: f?.type,
                    display: f?.display
                };
            })
        );

        res.status(200).send(fileInfos);
    });
};

const getFile = async (req, res) => {
    const p = req.params.name;
    const g = req.query.group;
    const t = getfileFormat(req.query.type);
    const fullPath = `${__basedir}/resources/static/${g}/${t}/${p}`;
    const baseUrl = getReqBaseUrl(req, res);

    if (!fs.existsSync(fullPath)) {
        return res.status(200).send(null);
    }

    try {
        await fs.promises.access(fullPath, fs.constants.R_OK);

        if (p !== "default") {
            const f = await getFileType(p, g, t);
            const fileInfo = [
                {
                    name: p,
                    url: `${baseUrl}/api/v1/files/${p}`,
                    type: f?.type,
                    display: f?.display,
                    origin: fullPath
                }
            ];
            return res.status(200).send(fileInfo);
        }

        return res.status(200).send([]);
    } catch (e) {
        return res.status(500).send({ message: "Unable to scan file!" });
    }
};

const convertBase64 = async (path, type) => {
    if (videoTypes.includes(type) && ffmpeg) {
        ffmpeg(path).takeScreenshots(
            { count: 1, timemarks: ["600"] },
            `${__basedir}/resources/static/thumbnail`,
            function () { /* noop */ }
        );
    } else if (audioTypes.includes(type)) {
        return "./assets/images/music.svg";
    } else if (documentTypes.includes(type)) {
        return "./assets/images/file.svg";
    } else if (imagesTypes.includes(type)) {
        // 🔹 HERE is the updated bit
        const data = await sharp(path).resize({ width: 1000 }).toBuffer();
        const ext = String(type).toLowerCase();
        const mime = ext === 'jpg' ? 'jpeg' : ext; // jpg -> jpeg
        return `data:image/${mime};base64,${data.toString("base64")}`;
    }

    // fallback stays as-is (optional to change)
    try {
        const data = await sharp(path).resize({ width: 1000 }).toBuffer();
        return `data:image/gif;base64,${data.toString("base64")}`;
    } catch {
        return "./assets/images/file.svg";
    }
};


const getFileType = async (file, group, type) => {
    if (!file) return null;

    const ext = String(file).split(".").pop();
    const icon = getfileImgforDisplay(ext);
    const path = `${__basedir}/resources/static/${group}/${type}/${file}`;

    const display =
        icon === "" ? await convertBase64(path, ext) : icon;

    return { type: ext, display };
};

const getfileFormat = (type) => {
    if (videoTypes.includes(type)) return "video";
    if (audioTypes.includes(type)) return "music";
    if (documentTypes.includes(type)) return "document";
    if (imagesTypes.includes(type)) return "image";
    return "";
};

const getfileImgforDisplay = (type) => {
    if (videoTypes.includes(type)) return "./assets/images/video.svg";
    if (audioTypes.includes(type)) return "./assets/images/music.svg";
    if (documentTypes.includes(type)) return "./assets/images/file.svg";
    if (imagesTypes.includes(type)) return "";
    return "./assets/images/file.svg";
};

const streamVideo = (req, res) => {
    const p = req.params.name;
    const g = req.query.group;
    const type = req.query.type;
    const t = getfileFormat(req.query.type);
    const videoPath = `${__basedir}/resources/static/${g}/${t}/${p}`;

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = end - start + 1;
        const file = fs.createReadStream(videoPath, { start, end });
        const head = {
            "Content-Range": `bytes ${start}-${end}/${fileSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": chunkSize,
            "Content-Type": `video/${type}`
        };
        res.writeHead(206, head);
        file.pipe(res);
    } else {
        const head = {
            "Content-Length": fileSize,
            "Content-Type": `video/${type}`
        };
        res.writeHead(200, head);
        fs.createReadStream(videoPath).pipe(res);
    }
};

const download = (req, res) => {
    const fileName = req.params.name;
    const directoryPath = `${__basedir}/resources/static/assets/uploads/`;

    res.download(directoryPath + fileName, fileName, (err) => {
        if (err) {
            res.status(500).send({ message: "Could not download the file. " + err });
        }
    });
};

module.exports = {
    upload,
    getListFiles,
    getFile,
    streamVideo,
    getFileType,
    download,
    videoTypes,
    audioTypes,
    documentTypes,
    imagesTypes
};
