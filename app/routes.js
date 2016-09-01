var runTest = require('./../test');
var Test = require('./models/test');

module.exports = function(app) {
    app.post('/', function(req, res) {
        var test = new Test({
            flowId: req.body.id,
            start: Date.now(),
            status: "running"
        });
        
        test.save(function (error, test) {
            if (error) {
                res.send(error);
            }
            else {
                runTest(req.body, test.id);
                res.send('hello from the other side');
            }
        });
    });
}
