const util = require("util");
const fs = require('fs');
const multer = require("multer");
const maxSize = 20 * 1024 * 1024;

let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    //console.log(req.body, req.params, file)
    let group = req.query.group;
    let type = req.query.type;
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

let uploadFile = multer({
  storage: storage,
  limits: { fileSize: maxSize },
}).single("file");

let uploadFileMiddleware = util.promisify(uploadFile);
module.exports = uploadFileMiddleware;