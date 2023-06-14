const util = require("util");
const fs = require('fs');
const multer = require("multer");
const maxSize = 20 * 1024 * 1024;

let videoTypes = ['mov','mp4','avi','mpeg'];
let audioTypes = ['mp3','wav'];
let documentTypes = ['pdf','word','xlsx','csv','xls'];
let imagesTypes = ['jpg','jpeg','JPG','png','gif','tiff','svg'];

let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    //console.log(req.body, req.params, file)
    let group = req.query.group;
    let type = getfileFormat(req.query.type);
    console.log('G: '+ group, 'T: '+ type+ ' dir created');
    if(!fs.existsSync(__basedir + "/resources/static/" +group+'/'+type)){
      fs.mkdirSync(__basedir + "/resources/static/" +group+'/');
      fs.mkdirSync(__basedir + "/resources/static/" +group+'/'+type);
    }
    cb(null, __basedir + "/resources/static/" +group+'/'+type);
  },
  filename: (req, file, cb) => {
    let name = file.originalname.replace(/\s+/g, '-');
    cb(null, name);
  },
});

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

let uploadFile = multer({
  storage: storage,
  limits: { fileSize: maxSize },
}).single("file");

let uploadFileMiddleware = util.promisify(uploadFile);
module.exports = uploadFileMiddleware;