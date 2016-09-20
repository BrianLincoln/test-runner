var webdriverio = require('webdriverio');
var mocha = require('wdio-mocha-framework');
var assert = require('assert');
var Test = require('./app/models/test');

module.exports = function(flow, testId) {
    var stepDelay = 20;
    var options = {
        desiredCapabilities: {
            browserName: 'chrome'
        }
    };
    var client = webdriverio.remote(options);
    var screeshotPath = "./public/screenshots/";
    var failure = undefined;

    client.addCommand('generateDynamicCommands',generateDynamicCommands.bind(client));
    client.addCommand('executeDynamicCommandsSequentially',executeDynamicCommandsSequentially.bind(client));


    function generateDynamicCommands(steps) {
        var promiseFactories = [];
        for( var i = 0; i < steps.length; i++) {
            var step = steps[i];
            var command = dynamicCommand.bind(this, step);
            promiseFactories.push(command);
        }
        return promiseFactories;
    }

    function dynamicCommand(step) {
        if (failure)
            return;

        console.log("dynamic command");
        console.log(step);
        switch (step.stepType) {
            case "pageLoad":
                return this
                  .url(step.url)
                  .then(function(){
                      //not called
                  }, function(e) {
                      failure = {
                          stepId: step._id,
                          reason: "failed to load url"
                      }
                  })
                  .saveScreenshot(screeshotPath + step._id + ".png")
                  .pause(stepDelay);
                break;
            case "click":
                return this
                    .waitForVisible(step.selector)
                    .then(function(){
                        //found element
                    }, function(e) {
                        //didn't find element
                        failure = {
                            stepId: step._id,
                            reason: "failed to find element"
                        }
                    })
                    .click(step.selector)
                    .then(function(){
                        //clicked element
                    }, function(e) {
                        //counldn't click element
                        failure = {
                            stepId: step._id,
                            reason: "failed to click element"
                        }
                    })
                    .saveScreenshot(screeshotPath + step._id + ".png")
                    .pause(stepDelay);
                break;
            case "input":
                return this
                    .waitForVisible(step.selector)
                    .then(function(){
                        //not called
                    }, function(e) {
                        failure = {
                            stepId: step._id,
                            reason: "failed to find element"
                        }
                    })
                    .setValue(step.selector, step.inputValue)
                    .then(function(){
                        //not called
                    }, function(e) {
                        failure = {
                            stepId: step._id,
                            reason: "failed to set value"
                        }
                    })
                    .saveScreenshot(screeshotPath + step._id + ".png")
                    .pause(stepDelay);
                break;

            case "confirmElementExists":
                return this
                    .waitForVisible(step.selector)
                    .then(function(){
                        //not called
                    }, function(e) {
                        failure = {
                            stepId: step._id,
                            reason: "failed to find element"
                        }
                    })
                    .saveScreenshot(screeshotPath + step._id + ".png")
                    .pause(stepDelay);
                break;
        }
    }

    function executeDynamicCommandsSequentially(commands) {
        var result = Promise.resolve();

        commands.forEach(function (command, index) {
            result = result.then(command)
            .then(function(err){
                //not called
            }, function(err) {
            })
        });
        return result;
    }

    client.init()
        .generateDynamicCommands(flow.steps)
        .then(function(commands){
            return executeDynamicCommandsSequentially(commands);
        })
        .then(function(err){
            console.log("=================== 1");
            updateDb("success", "complete", Date.now());
        })
        .end(function(err){
        })

    function updateDb() {
        var query = {_id: testId};
        var update = {
            result: failure === undefined ? "success" : "failed",
            status: "complete",
            finished: Date.now(),
            flowId: flow.id,
            failure: failure
        }
        Test.update(
            query,
            update,
            function(err) {
                if (err) {
                    console.log("failed to update");
                    console.log(err);
                }
                else {
                    console.log("updated!");
                }
            }
        )
    }
}
