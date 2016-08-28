var webdriverio = require('webdriverio');

module.exports = function(flow) {

    var stepDelay = 0;
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
                  .url(step.url).pause(stepDelay);
                break;
            case "click":
                return this
                    .waitForVisible(step.selector)
                    .click(step.selector).pause(stepDelay);
                break;
            case "input":
                return this
                    .waitForVisible(step.selector)
                    .setValue(step.selector, step.inputValue).pause(stepDelay);
                break;

            case "confirmElementExists":
                return this
                    .waitForVisible(step.selector).pause(stepDelay)
                break;
        }
    }

    function executeDynamicCommandsSequentially(commands) {
        var result = Promise.resolve();
        commands.forEach(function (command) {
            result = result.then(command);
        });
        return result;
    }

    client.init()
        .generateDynamicCommands(flow.steps)
        .then(function(commands){
            return executeDynamicCommandsSequentially(commands);
        })
        .end();

}
