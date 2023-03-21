const { verifySignUp } = require("../middleware");
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
    // defaults end

    //register
    app.post(`/api/v1/${itemTopic}/signup`, [verifySignUp.checkDuplicateUsernameOrEmail, verifySignUp.checkRolesExisted], controller.signup);

    // log in/out
    app.post(`/api/v1/${itemTopic}/signin`, controller.signin);
    app.post(`/api/v1/${itemTopic}/signout`, controller.signout);
}
