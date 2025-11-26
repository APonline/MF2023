let path = require('path');
let itemTopic = path.basename(__filename).split('.')[0];
const controller = require(`../controllers/${itemTopic}.controller`);
let baseName = itemTopic.charAt(0).toUpperCase() + itemTopic.slice(1); 

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

    app.post(`/api/v1/${itemTopic}`, controller[`create${baseName}`]);
    app.get(`/api/v1/${itemTopic}`, controller[`getAll${baseName}`]);
    app.get(`/api/v1/${itemTopic}/artist/:id`, controller[`getAllFor${baseName}artist`]);
    app.get(`/api/v1/${itemTopic}/:id`, controller[`get${baseName}`]);
    app.put(`/api/v1/${itemTopic}/:id`, controller[`update${baseName}`]);
    app.delete(`/api/v1/${itemTopic}/:id`, controller[`delete${baseName}`]);

} 
