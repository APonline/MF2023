const { authJwt } = require("../middleware");
let path = require('path');
let itemTopic = path.basename(__filename).split('.')[0];
const controller = require(`../controllers/${itemTopic}.controller`);

module.exports = function(app) {
    // defaults
    app.use(function(req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "Origin, Content-Type, Accept"
        );
        next();
    });
    // app.get("/api/test/all", controller.allAccess);
    // app.get("/api/test/user", [authJwt.verifyToken], controller.userBoard);
    // app.get("/api/test/mod", [authJwt.verifyToken, authJwt.isModerator], controller.moderatorBoard);
    // app.get("/api/test/admin", [authJwt.verifyToken, authJwt.isAdmin], controller.adminBoard);
    // defaults end

    app.get(`/api/v1/${itemTopic}`, controller[`getAll${itemTopic.charAt(0).toUpperCase() + itemTopic.slice(1).slice(0, -1)}s`] );
    app.get(`/api/v1/${itemTopic}/:id`, controller[`get${itemTopic.charAt(0).toUpperCase() + itemTopic.slice(1).slice(0, -1)}`] );
    app.put(`/api/v1/${itemTopic}/:id`, controller[`update${itemTopic.charAt(0).toUpperCase() + itemTopic.slice(1).slice(0, -1)}`] );
    app.put(`/api/v1/${itemTopic}/online/:id`, controller[`update${itemTopic.charAt(0).toUpperCase() + itemTopic.slice(1).slice(0, -1)}`] );
    app.delete(`/api/v1/${itemTopic}/:id`, controller[`delete${itemTopic.charAt(0).toUpperCase() + itemTopic.slice(1).slice(0, -1)}`] );
    app.get(`/api/v1/${itemTopic}/passwordReset`, controller.requestPassword );
    app.get(`/api/v1/${itemTopic}/verify`, controller.verifyUser );
}
 