/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const uploadFile = require("../middleware/upload");

// ffmpeg is optional – we guard the require so dev doesn't crash if missing
let ffmpeg;
try {
    // eslint-disable-next-line global-require
    ffmpeg = require("fluent-ffmpeg");
} catch (_) {
    ffmpeg = null;
}

// file type groups
const videoTypes = ["mov", "mp4", "avi", "mpeg", "mkv", "webm"];
const audioTypes = ["mp3", "wav"];
const documentTypes = ['pdf','doc','docx','rtf','txt','word','xlsx','csv','xls'];
const imagesTypes = ["jpg", "jpeg", "JPG", "png", "gif", "tiff", "svg", "webp", "bmp"];

// base dir from server bootstrap
const __basedir = global.__basedir || process.cwd();

// central thumbnail folder for video screenshots
const THUMB_ROOT = path.join(__basedir, "resources", "static", "thumbnail");
if (!fs.existsSync(THUMB_ROOT)) {
    fs.mkdirSync(THUMB_ROOT, { recursive: true });
}

// small helper so we never crash if res.locals.baseUrl is missing
function getReqBaseUrl(req, res) {
    if (res && res.locals && res.locals.baseUrl) {
        return res.locals.baseUrl;
    }
    // hard-coded production fallback
    return "https://musefactory.app";
}

/**
 * Map an extension (mp4, jpg, pdf) to the folder name
 * under each artist group.
 */
function getfileFormat(extOrType) {
    const t = String(extOrType || "").toLowerCase();

    if (videoTypes.includes(t)) {
        return "video";
    }
    if (audioTypes.includes(t)) {
        return "music";
    }
    if (documentTypes.includes(t)) {
        return "document";
    }
    if (imagesTypes.includes(t)) {
        return "image";
    }

    return "";
}

/**
 * Return a static icon path for non-image/video types.
 */
function getfileImgforDisplay(ext) {
    const t = String(ext || "").toLowerCase();

    if (videoTypes.includes(t)) {
        return "./assets/images/video.svg";
    }
    if (audioTypes.includes(t)) {
        return "./assets/images/music.svg";
    }
    if (documentTypes.includes(t)) {
        return "./assets/images/file.svg";
    }

    // unknown fallback
    return "./assets/images/file.svg";
}

/**
 * Make sure we have a video thumbnail, and return it as base64.
 * Thumbs are stored under: resources/static/thumbnail/<basename>.jpg
 */
async function ensureVideoThumbnail(filePath, fileName) {
    const base = path.basename(fileName, path.extname(fileName));
    const thumbName = `${base}.jpg`;
    const thumbPath = path.join(THUMB_ROOT, thumbName);

    // already exists – just read + resize
    if (fs.existsSync(thumbPath)) {
        const data = await sharp(thumbPath).resize({ width: 1000 }).toBuffer();
        return `data:image/jpeg;base64,${data.toString("base64")}`;
    }

    // no ffmpeg installed → fall back to static icon
    if (!ffmpeg) {
        return "./assets/images/video.svg";
    }

    // generate a screenshot at 2 seconds in
    await new Promise((resolve, reject) => {
        ffmpeg(filePath)
            .on("end", resolve)
            .on("error", reject)
            .screenshots({
                count: 1,
                timemarks: ["00:00:02.000"],
                filename: thumbName,
                folder: THUMB_ROOT
            });
    });

    const data = await sharp(thumbPath).resize({ width: 1000 }).toBuffer();
    return `data:image/jpeg;base64,${data.toString("base64")}`;
}

/**
 * Convert an image file to base64 (resized).
 */
async function imageToBase64(filePath, ext) {
    const data = await sharp(filePath).resize({ width: 1000 }).toBuffer();
    const lower = String(ext || "").toLowerCase();
    const mime = lower === "jpg" ? "jpeg" : lower || "jpeg";
    return `data:image/${mime};base64,${data.toString("base64")}`;
}

/**
 * Core helper used by front-end to hydrate previews.
 * It figures out the right folder (image/video/etc), builds the path,
 * and returns `{ type: <ext>, display: <base64 or icon> }`.
 *
 * @param {string} file  - file name, eg "IMG_5016-1.mp4"
 * @param {string} group - eg "artists/94"
 * @param {string} extHint - optional extension ("mp4", "jpg"); if omitted,
 *                           we derive it from the filename.
 */
async function getFileType(file, group, extHint) {
    if (!file) {
        return null;
    }

    let ext = String(extHint || "").toLowerCase();
    if (!ext) {
        ext = path.extname(file).slice(1).toLowerCase();
    }

    const folder = getfileFormat(ext);
    const filePath = path.join(
        __basedir,
        "resources",
        "static",
        group || "",
        folder || "",
        file
    );

    if (!fs.existsSync(filePath)) {
        // file missing → generic icon
        return {
            type: ext,
            display: getfileImgforDisplay(ext)
        };
    }

    try {
        if (videoTypes.includes(ext)) {
            const thumb = await ensureVideoThumbnail(filePath, file);
            return { type: ext, display: thumb };
        }

        if (imagesTypes.includes(ext)) {
            const img64 = await imageToBase64(filePath, ext);
            return { type: ext, display: img64 };
        }

        // audio / docs / other → icon
        return {
            type: ext,
            display: getfileImgforDisplay(ext)
        };
    } catch (err) {
        console.error("[getFileType] failed", err, { file, group, ext });
        return {
            type: ext,
            display: getfileImgforDisplay(ext)
        };
    }
}

/**
 * Upload endpoint – uses middleware and just returns a simple status.
 */
const upload = async (req, res) => {
    try {
        await new Promise((resolve, reject) => {
            uploadFile(req, res, (err) => (err ? reject(err) : resolve()));
        });

        if (!req || !req.file) {
            return res.status(400).send({ message: "Please upload a file!" });
        }

        return res
            .status(200)
            .send({ message: "Uploaded the file successfully." });
    } catch (err) {
        console.error("[upload] failed", err);
        return res
            .status(500)
            .send({ message: `Could not upload the file. ${err}` });
    }
};

/**
 * List all files of a given type for a group.
 *   GET /api/v1/files?group=artists/94&type=mp4
 */
const getListFiles = (req, res) => {
    const group = req.query.group;        // eg "artists/94"
    const ext = (req.query.type || "").toLowerCase();
    const folder = getfileFormat(ext);
    const baseUrl = getReqBaseUrl(req, res);

    if (!group || !folder) {
        return res.status(400).send({ message: "Missing group or type." });
    }

    const directoryPath = path.join(
        __basedir,
        "resources",
        "static",
        group,
        folder
    );

    fs.readdir(directoryPath, async (err, files) => {
        if (err) {
            console.error("[getListFiles] readdir failed", err);
            return res
                .status(500)
                .send({ message: "Unable to scan files!" });
        }

        const clean = (files || []).filter(
            (f) => f && f !== ".DS_Store"
        );

        try {
            const fileInfos = await Promise.all(
                clean.map(async (file) => {
                    const f = await getFileType(file, group, ext);
                    return {
                        name: file,
                        url: `${baseUrl}/api/v1/files/${file}?group=${encodeURIComponent(
                            group
                        )}&type=${ext}`,
                        type: f?.type,
                        display: f?.display
                    };
                })
            );

            return res.status(200).send(fileInfos);
        } catch (e) {
            console.error("[getListFiles] failed", e);
            return res
                .status(500)
                .send({ message: "Unable to scan files!" });
        }
    });
};

/**
 * Get preview info for a single file.
 *   GET /api/v1/files/:name?group=artists/94&type=mp4
 */
const getFile = async (req, res) => {
    const fileName = req.params.name;
    const group = req.query.group;           // eg "artists/94"
    const ext = (req.query.type || "").toLowerCase();
    const folder = getfileFormat(ext);
    const baseUrl = getReqBaseUrl(req, res);

    if (!group || !folder || !fileName) {
        return res.status(400).send({ message: "Missing params." });
    }

    const fullPath = path.join(
        __basedir,
        "resources",
        "static",
        group,
        folder,
        fileName
    );

    if (!fs.existsSync(fullPath)) {
        return res.status(200).send(null);
    }

    try {
        await fs.promises.access(fullPath, fs.constants.R_OK);

        if (fileName !== "default") {
            const f = await getFileType(fileName, group, ext);
            const fileInfo = [
                {
                    name: fileName,
                    url: `${baseUrl}/api/v1/files/${fileName}?group=${encodeURIComponent(
                        group
                    )}&type=${ext}`,
                    type: f?.type,
                    display: f?.display,
                    origin: fullPath
                }
            ];
            return res.status(200).send(fileInfo);
        }

        return res.status(200).send([]);
    } catch (e) {
        console.error("[getFile] failed", e);
        return res.status(500).send({ message: "Unable to scan file!" });
    }
};

const getRawFile = (req, res) => {
    const fileName = req.params.name;
    const group = req.query.group;
    const ext = (req.query.type || "").toLowerCase();
    const folder = getfileFormat(ext);

    if (!group || !folder || !fileName) {
        return res.status(400).send({ message: "Missing params." });
    }

    const fullPath = path.join(
        __basedir,
        "resources",
        "static",
        group,
        folder,
        fileName
    );

    if (!fs.existsSync(fullPath)) {
        return res.status(404).send({ message: "File not found." });
    }

    // Try to render inline when possible
    res.setHeader("Content-Disposition", "inline");

    // Basic content-type mapping (good enough)
    const mimeMap = {
        pdf: "application/pdf",
        rtf: "application/rtf",
        txt: "text/plain",
        csv: "text/csv"
    };

    res.type(mimeMap[ext] || "application/octet-stream");
    return res.sendFile(fullPath);
};

/**
 * Stream video bytes with Range support.
 * Frontend usage:
 *   <video [src]="root + 'api/v1/files/stream/' + item.location_url + '?group=artists/' + groupId + '&type=' + item.extension" ...>
 */
const streamVideo = (req, res) => {
    const fileName = req.params.name;
    const group = req.query.group;           // "artists/94"
    const ext = (req.query.type || "").toLowerCase();
    const folder = getfileFormat(ext);       // "video"

    if (!group || !folder || !fileName) {
        return res.status(400).send("Missing params.");
    }

    const videoPath = path.join(
        __basedir,
        "resources",
        "static",
        group,
        folder,
        fileName
    );

    if (!fs.existsSync(videoPath)) {
        return res.status(404).send("Video not found.");
    }

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
            "Content-Type": `video/${ext || "mp4"}`
        };

        res.writeHead(206, head);
        file.pipe(res);
    } else {
        const head = {
            "Content-Length": fileSize,
            "Content-Type": `video/${ext || "mp4"}`
        };
        res.writeHead(200, head);
        fs.createReadStream(videoPath).pipe(res);
    }
};

/**
 * Simple download helper (for general assets).
 */
const download = (req, res) => {
    const fileName = req.params.name;
    const directoryPath = path.join(
        __basedir,
        "resources",
        "static",
        "assets",
        "uploads"
    );

    res.download(path.join(directoryPath, fileName), fileName, (err) => {
        if (err) {
            console.error("[download] failed", err);
            res.status(500).send({
                message: "Could not download the file. " + err
            });
        }
    });
};

module.exports = {
    upload,
    getListFiles,
    getFile,
    getRawFile,
    streamVideo,
    download,
    getFileType,
    videoTypes,
    audioTypes,
    documentTypes,
    imagesTypes
};
