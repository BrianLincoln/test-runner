var test = require('./../test');

module.exports = function(app) {
    app.post('/', function(req, res) {
        test(req.body);
        res.send('hello from the other side');
    });
}
