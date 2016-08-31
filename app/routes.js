var runTest = require('./../test');
var Test = require('./models/test');

module.exports = function(app) {
    app.post('/', function(req, res) {
        console.log(req.body);
        var test = new Test({
            flowId: req.body.id,
            start: Date.now()
        });
        test.save(function (error, test) {
            if (error) {
                return error
            }
            else {
                console.log("saved test to db");
            }
        });
        runTest(req.body);
        res.send('hello from the other side');
    });
}
