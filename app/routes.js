var runTest = require('./../test');
var Test = require('./models/test');

module.exports = function(app) {
    app.post('/', function(req, res) {
        //remove previous test(s) with matching flowId
        Test.remove({flowId: req.body.flow.id}, function(err) {
            if (!err) {
                var test = new Test({
                    flowId: req.body.flow.id,
                    start: Date.now(),
                    status: "running"
                });

                test.save(function (err, test) {
                    if (!err) {
                        runTest(req.body.flow, test.id);
                    }
                    else {
                        console.log(err);
                        res.send(err);
                    }
                });
            }
            else {
                console.log(err);
            }
        });
    });
}
