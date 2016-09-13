var webdriverio = require('webdriverio');
var mocha = require('wdio-mocha-framework');
var assert = require('assert');
var Test = require('./app/models/test');

module.exports = function(flow, testId) {
    var stepDelay = 200;
    var options = {
        desiredCapabilities: {
            browserName: 'chrome'
        }
    };
    var client = webdriverio.remote(options);
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
        switch (step.stepType) {
            case "pageLoad":
                return this
                  .url(step.url)
                  .then(function(){
                      //not called
                  }, function(e) {
                      throw new Error("failed to load url");
                  })
                  .pause(stepDelay);
                break;
            case "click":
                return this
                    .waitForVisible(step.selector)
                    .then(function(){
                        //not called
                    }, function(e) {
                        throw new Error("failed to find element");
                    })
                    .click(step.selector)
                    .then(function(){
                        //not called
                    }, function(e) {
                        throw new Error("failed to click element");
                    })
                    .pause(stepDelay);
                break;
            case "input":
                return this
                    .waitForVisible(step.selector)
                    .then(function(){
                        //not called
                    }, function(e) {
                        throw new Error("failed to find element");
                    })
                    .setValue(step.selector, step.inputValue)
                    .then(function(){
                        //not called
                    }, function(e) {
                        throw new Error("failed to set value");
                    })
                    .pause(stepDelay);
                break;

            case "confirmElementExists":
                return this
                    .waitForVisible(step.selector)
                    .then(function(){
                        //not called
                    }, function(e) {
                        throw new Error("failed to find element");
                    })
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
                throw new Error(err.message);
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
            updateDb("success", "complete", Date.now());
            //not called
        }, function(err) {
            updateDb("failed", "complete", Date.now(), err);
            return err.message;
        })
        .end(function(err){
        })

    function updateDb(result, status, finishDateTime, details) {
        var query = {_id: testId};
        var update = {
            result: result,
            status: status,
            finished: finishDateTime,
            flowId: flow.id
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
