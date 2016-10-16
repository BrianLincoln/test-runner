var webdriverio = require('webdriverio');
var mocha = require('wdio-mocha-framework');
var assert = require('assert');
var Test = require('./app/models/test');
var saveImageToS3 = require('./upload-screenshot');
var config = require('./config/config.js');

module.exports = function(flow, testId) {
    var stepDelay = 20;
    var options = {
        desiredCapabilities: {
            browserName: 'chrome'
        }
    };
    var client = webdriverio.remote(options);
    var failure = undefined;
    var screenshots = [];

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

        switch (step.stepType) {
            case "pageLoad":
                return this
                  .url(step.url)
                  .then(function(){
                      return client.saveScreenshot();
                  }, function(e) {
                      failure = failure !== undefined
                          ? failure
                          : {
                              stepId: step._id,
                              reason: "failed to load url"
                          }
                  })
                  .then(function(screenshot) {
                      handleScreenShot(screenshot, step._id);
                  })
                  .pause(stepDelay);
                break;
            case "click":
                return this
                    .waitForVisible(step.selector)
                    .then(function(){}, function(e) {
                        //didn't find element
                        failure = failure !== undefined
                            ? failure
                            : {
                                stepId: step._id,
                                reason: "failed to find element"
                            }
                    })
                    .click(step.selector)
                    .then(function(){
                        return client.saveScreenshot();
                    }, function(e) {
                        //counldn't click element
                        failure = failure !== undefined
                            ? failure
                            : {
                                stepId: step._id,
                                reason: "failed to click element"
                            }
                    })
                    .then(function(screenshot) {
                        handleScreenShot(screenshot, step._id);
                    })
                    .pause(stepDelay);
                break;
            case "hover":
                return this
                    .waitForVisible(step.selector)
                    .then(function(){}, function(e) {
                        //didn't find element
                        failure = failure !== undefined
                            ? failure
                            : {
                                stepId: step._id,
                                reason: "failed to find element"
                            }
                    })
                    .moveToObject(step.selector)
                    .then(function(){
                        return client.saveScreenshot();
                    }, function(e) {
                        //counldn't click element
                        failure = failure !== undefined
                            ? failure
                            : {
                                stepId: step._id,
                                reason: "failed to hover element"
                            }
                    })
                    .then(function(screenshot) {
                        handleScreenShot(screenshot, step._id);
                    })
                    .pause(stepDelay);
                break;
            case "input":
                return this
                    .waitForVisible(step.selector)
                    .then(function(){}, function(e) {
                        failure = failure !== undefined
                            ? failure
                            : {
                                stepId: step._id,
                                reason: "failed to find element"
                            }
                    })
                    .setValue(step.selector, step.inputValue)
                    .then(function(){
                        return client.saveScreenshot();
                    }, function(e) {
                        failure = failure !== undefined
                            ? failure
                            : {
                                stepId: step._id,
                                reason: "failed to set value"
                            }
                    })
                    .then(function(screenshot) {
                        handleScreenShot(screenshot, step._id);
                    })
                    .pause(stepDelay);
                break;

            case "confirmElementExists":
                return this
                    .waitForVisible(step.selector)
                    .then(function(){
                        return client.saveScreenshot();
                    }, function(e) {
                        failure = failure !== undefined
                            ? failure
                            : {
                                stepId: step._id,
                                reason: "failed to find element"
                            }
                    })
                    .then(function(screenshot) {
                        handleScreenShot(screenshot, step._id);
                    })
                    .pause(stepDelay);
                break;
        }
    }

    function executeDynamicCommandsSequentially(commands) {
        var result = Promise.resolve();

        commands.forEach(function (command, index) {
            result = result.then(command)
            .then(function(err){}, function(err) {})
        });
        return result;
    }

    function handleScreenShot(screenshot, stepId) {
        var fileName = "screenshots/" + flow.id + "/" + stepId + ".png";
        var screenShotMetaData = {
            "stepId": stepId,
            "fileName": fileName,
            "fullURL": config.screenshotBasePath + "/" + fileName
        };

        saveImageToS3(screenshot, fileName);
        screenshots.push(screenShotMetaData);
    }

    client.init()
        .generateDynamicCommands(flow.steps)
        .then(function(commands){
            return executeDynamicCommandsSequentially(commands);
        })
        .then(function(err){
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
            screenshots: screenshots,
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
