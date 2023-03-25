const express = require("express");
const router = express.Router();
const controller = require("../controllers/file.controller");

let routes = (app) => {
  router.post("/api/v1/upload", controller.upload);
  router.get("/api/v1/files", controller.getListFiles);
  router.get("/api/v1/files/:name", controller.download);

  app.use(router);
};

module.exports = routes;