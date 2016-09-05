var runTest = require('./../test');
var Test = require('./models/test');

module.exports = function(app) {
    app.post('/', function(req, res) {
        //remove previous test(s) with matching flowId        
        Test.remove({flowId: req.body.flow.id}, function(err) {
            if (!err) {
                console.log("removed other tests")
            }
            else {
                console.log(err);
            }
        });


        var test = new Test({
            flowId: req.body.flow.id,
            start: Date.now(),
            status: "running"
        });

        test.save(function (error, test) {
            if (error) {
                res.send(error);
            }
            else {
                runTest(req.body.flow, test.id);
                res.send('hello from the other side');
            }
        });
    });
}
