//===============TEMP=========== will come from API irl
var flow = {
    "steps": [
        {
            "stepType": "pageLoad",
            "_id": "57bf78713346f43c1e55e547",
            "url": "http://localhost:8080"
        },
        {
            "stepType": "click",
            "_id": "57bf79163346f43c1e55e548",
            "selector": "[data-tar=\"login\"]"
        }
    ]
}

var webdriverio = require('webdriverio');
var stepDelay = 500;
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
    console.log("===================dynamicCommand");
    console.log(step);

    switch (step.stepType) {
        case "pageLoad":
            console.log("===========url step");
            return this
              .url(step.url).pause(stepDelay);
            break;
        case "click":
            console.log("=============click step");
            return this
                .waitForVisible(step.selector)
                .click(step.selector).pause(stepDelay);
            break;
        case "input":
            console.log("=============input step");
            return this
                .waitForVisible(step.selector)
                .setValue(step.selector, step.inputValue).pause(stepDelay);
            break;

        case "confirmElementExists":
            console.log("=============confirm element exists step");
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
        console.log("commands");
        console.log(commands);
        return executeDynamicCommandsSequentially(commands);
    })
    .end();
