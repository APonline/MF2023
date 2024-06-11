const uploadFile = require("../middleware/upload");
const fs = require('fs');

let videoTypes = ['mov','mp4','avi','mpeg'];
let audioTypes = ['mp3','wav'];
let documentTypes = ['pdf','word','xlsx','csv','xls'];
let imagesTypes = ['jpg','jpeg','JPG','png','gif','tiff','svg'];

__basedir = global.__basedir;
baseUrl = global.baseUrl;

const upload = (req, res) => {
  try {
    uploadFile(req, res);

    if (req == undefined) {
      return res.status(400).send({ message: "Please upload a file!" });
    }

    res.status(200).send({
      message: "Uploaded the file successfully: ",
    });
  } catch (err) {
    res.status(500).send({
      message: `Could not upload the file. ${err}`,
    });
  }
};

const getListFiles = (req, res) => {
  let p = req.params.name;
  let g = req.query.group;
  let t = getfileFormat(req.query.type);
  const directoryPath = __basedir + "/resources/static/" +g+ "/" + t + "/";

  fs.readdir(directoryPath, function (err, files) {
    if (err) {
      res.status(500).send({
        message: "Unable to scan files!",
      });
    }

    let fileInfos = [];

    files.map((f,i) => {
      if(f == '.DS_Store' && f == 'image'){
        const index = array.indexOf(f);
        if (index > -1) {
          files.splice(index, 1);
        }
      }
    });

    files.forEach( (file) => {
        let f = getFileType(p,g,t);
        fileInfos.push({
            name: p,
            url: baseUrl + '/api/v1/files/' + p,
            type: f.type,
            display: f.display
        });
    });

    res.status(200).send(fileInfos);
  });
};

const getFile = (req, res) => {
  let p = req.params.name;
  let g = req.query.group;
  let t = getfileFormat(req.query.type);
  const directoryPath = __basedir + "/resources/static/" +g+ "/" + t + "/" +p;

  if (fs.existsSync(directoryPath)) {
    fs.readFile(directoryPath, (err, file)=>{
      if(err) {
        res.status(500).send({
          message: "Unable to scan file!",
        });
      }
  
      let fileInfo = [];
  
      if(p!='default'){
        let f = getFileType(p,g,t);
        fileInfo.push({
            name: p,
            url: baseUrl + '/api/v1/files/' + p,
            type: f.type,
            display: f.display
        });
  
        res.status(200).send(fileInfo);
      }
    });
  } else {
    res.status(200).send(null);
  }

};

const convertBase64 = (path) => {
  return "data:image/gif;base64,"+fs.readFileSync(path,  'base64');
};

const getFileType = (file, group, type) => {
  if(file != undefined){
    let f = file.split('.');
    let fCount = f.length;

    let img = getfileImgforDisplay(f[fCount - 1]);

    let obj = {
        type: f[fCount - 1],
        display: ( img == '' ? convertBase64(__basedir + "/resources/static/"+group+"/"+type+"/" + file)  : img)
    }

    return obj;
  }
}

const getfileFormat = (type) => {
  let img = '';
  if(videoTypes.indexOf(type) >= 0){
      img = 'video';
  }else if(audioTypes.indexOf(type) >= 0){
      img = 'music';
  }else if(documentTypes.indexOf(type) >= 0){
      img = 'document';
  }else if(imagesTypes.indexOf(type) >= 0){
      img = 'image';
  }
  return img;
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
  getFile,
  getFileType,
  download,
  videoTypes,
  audioTypes,
  documentTypes,
  imagesTypes
};