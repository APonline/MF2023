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

    app.post(`/api/v1/${itemTopic}`, controller[`create${itemTopic.charAt(0).toUpperCase() + itemTopic.slice(1).slice(0, -1)}`]);
    app.get(`/api/v1/${itemTopic}`, controller[`getAll${itemTopic.charAt(0).toUpperCase() + itemTopic.slice(1).slice(0, -1)}s`]);
    app.get(`/api/v1/${itemTopic}/user/:id`, controller[`getAllFor${itemTopic.charAt(0).toUpperCase() + itemTopic.slice(1).slice(0, -1)}`]);
    app.get(`/api/v1/${itemTopic}/artist/:id`, controller[`getAllFor${itemTopic.charAt(0).toUpperCase() + itemTopic.slice(1).slice(0, -1)}artist`]);
    app.get(`/api/v1/${itemTopic}/:id`, controller[`get${itemTopic.charAt(0).toUpperCase() + itemTopic.slice(1).slice(0, -1)}`]);
    app.put(`/api/v1/${itemTopic}/:id`, controller[`update${itemTopic.charAt(0).toUpperCase() + itemTopic.slice(1).slice(0, -1)}`]);
    app.delete(`/api/v1/${itemTopic}/:id`, controller[`delete${itemTopic.charAt(0).toUpperCase() + itemTopic.slice(1).slice(0, -1)}`]);

} 