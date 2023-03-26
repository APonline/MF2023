const uploadFile = require("../middleware/upload");
const fs = require('fs');

let videoTypes = ['mov','mp4','avi','mpeg'];
let audioTypes = ['mp3','wav'];
let documentTypes = ['pdf','word','xlsx','csv','xls'];
let imagesTypes = ['jpg','jpeg','JPG','png','gif','tiff','svg'];

__basedir = global.__basedir;
baseUrl = global.baseUrl;

const upload = async (req, res) => {
  //try {
    await uploadFile(req, res);

    if (req.file == undefined) {
      return res.status(400).send({ message: "Please upload a file!" });
    }

    res.status(200).send({
      message: "Uploaded the file successfully: " + req.file.originalname,
    });
//   } catch (err) {
//     res.status(500).send({
//       message: `Could not upload the file: ${req.file.originalname}. ${err}`,
//     });
//   }
};

const getListFiles = (req, res) => {
  const directoryPath = __basedir + "/resources/static/assets/uploads/";

  fs.readdir(directoryPath, function (err, files) {
    if (err) {
      res.status(500).send({
        message: "Unable to scan files!",
      });
    }

    let fileInfos = [];

    files.forEach( (file) => {
        let f = getFileType(file);
        fileInfos.push({
            name: file,
            url: baseUrl + '/api/v1/files/' + file,
            type: f.type,
            display: f.display
        });
    });

    res.status(200).send(fileInfos);
  });
};

const getFileType = (file) => {
    let f = file.split('.');
    let fCount = f.length;

    let img = getfileImgforDisplay(f[fCount - 1]);

    let obj = {
        type: f[fCount - 1],
        display: ( img == '' ? baseUrl + '/api/v1/files/' + file : img)
    }

    return obj;
}

const getfileImgforDisplay = (type) => {
    let img = '';
    if(videoTypes.indexOf(type) >= 0){
        img = './assets/images/video.svg';
    }else if(audioTypes.indexOf(type) >= 0){
        img = './assets/images/music.svg';
    }else if(documentTypes.indexOf(type) >= 0){
        img = './assets/images/file.svg';
    }else if(imagesTypes.indexOf(type) >= 0){
        img = '';
    }
    return img;
}

const download = (req, res) => {
  const fileName = req.params.name;
  const directoryPath = __basedir + "/resources/static/assets/uploads/";

  res.download(directoryPath + fileName, fileName, (err) => {
    if (err) {
      res.status(500).send({
        message: "Could not download the file. " + err,
      });
    }
  });
};

module.exports = {
  upload,
  getListFiles,
  download,
};