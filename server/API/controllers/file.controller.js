const uploadFile = require("../middleware/upload");
const fs = require('fs');
const sharp = require('sharp');

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
    fs.readFile(directoryPath, async (err, file)=>{
      if(err) {
        res.status(500).send({
          message: "Unable to scan file!",
        });
      }
  
      let fileInfo = [];
  
      if(p!='default'){
        let f = await getFileType(p,g,t);
        fileInfo.push({
            name: p,
            url: baseUrl + '/api/v1/files/' + p,
            type: f.type,
            display: f.display,
            origin: directoryPath
        });
  
        res.status(200).send(fileInfo);
      }
    });
  } else {
    res.status(200).send(null);
  }

};

const convertBase64 = async (path, type) => {

  if(videoTypes.indexOf(type) >= 0){
    var proc = new ffmpeg(path)
    .takeScreenshots({
        count: 1,
        timemarks: [ '600' ] // number of seconds
      }, __basedir + "/resources/static/thumbnail", function(err) {
        console.log('screenshots were saved')
    });
    console.log(proc)
  }else if(audioTypes.indexOf(type) >= 0){
      img = './assets/images/music.svg';
  }else if(documentTypes.indexOf(type) >= 0){
      img = './assets/images/file.svg';
  }else if(imagesTypes.indexOf(type) >= 0){
    return await sharp(path)
    .resize({ width: 1000 })
    .toBuffer()
    .then(data => {
      // 100 pixels wide, auto-scaled height
      return `data:image/gif;base64,${data.toString('base64')}`;
    });
  }

  //sharp here
  var proc = new ffmpeg(path)
    .takeScreenshots({
        count: 1,
        timemarks: [ '600' ] // number of seconds
      }, __basedir + "/resources/static/thumbnail", function(err) {
      console.log('screenshots were saved')
    });

  // works to return an image
  return await sharp(path)
    .resize({ width: 1000 })
    .toBuffer()
    .then(data => {
      // 100 pixels wide, auto-scaled height
      return `data:image/gif;base64,${data.toString('base64')}`;
    });
  
  //return "data:image/gif;base64,"+fs.readFileSync(path,  'base64');
};

const getFileType = async (file, group, type) => {
  if(file != undefined){
    let f = file.split('.');
    let fCount = f.length;

    let img = getfileImgforDisplay(f[fCount - 1]);

    let displayItem = '';
    displayItem = ( img == '' ? await convertBase64(__basedir + "/resources/static/"+group+"/"+type+"/" + file, f[fCount - 1])  : img);
    // if(type=='image'){
    //   displayItem = ( img == '' ? await convertBase64(__basedir + "/resources/static/"+group+"/"+type+"/" + file, f[fCount - 1])  : img)
    //   console.log(displayItem, 'Hey')
    // }else if(type=='video'){
    //   displayItem = getVideoToDisplay(__basedir + "/resources/static/"+group+"/"+type+"/" + file, type);
    //   console.log(displayItem, 'HI')
    // }

    let obj = {
      type: f[fCount - 1],
      display: ( img == '' ? displayItem : img)
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

const streamVideo = (req, res) => {
  let p = req.params.name;
  let g = req.query.group;
  let type = req.query.type;
  let t = getfileFormat(req.query.type);
  const directoryPath = __basedir + "/resources/static/" +g+ "/" + t + "/" +p;
  const videoPath = directoryPath;
  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'video/'+type,
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/'+type,
    };

    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  }
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
  streamVideo,
  getFileType,
  download,
  videoTypes,
  audioTypes,
  documentTypes,
  imagesTypes
};