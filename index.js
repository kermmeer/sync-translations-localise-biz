
const core = require('@actions/core');
const action = require('./action.js');

const apiKey = core.getInput('apiKey', { required: true });
const destination = core.getInput('destination', { required: true });
var format = core.getInput('format');
if(!format || format === '') {
    format = 'json';
}

var failIfNotChanged = core.getInput('failIfNotChanged');
if(!failIfNotChanged || failIfNotChanged === '') {
    failIfNotChanged = false;
} else {
    failIfNotChanged = !!failIfNotChanged;
}

var noComments = core.getInput('noComments');
if(!noComments || noComments === '') {
    noComments = false;
} else {
    noComments = !!noComments;
}

var fallbackLanguage = core.getInput('fallbackLanguage');
if(!fallbackLanguage || fallbackLanguage === '') {
    fallbackLanguage = null;
}

var filePrefix = core.getInput('filePrefix');
if(!filePrefix || filePrefix === '') {
    filePrefix = '';
}

var fileNameOverrides = core.getInput("fileNameOverrides");
if(!fileNameOverrides || fileNameOverrides === ''){
    fileNameOverrides = {};
}else{
    fileNameOverrides = JSON.parse(fileNameOverrides);
}

action({ apiKey, destination, format, failIfNotChanged, noComments, fallbackLanguage, filePrefix, fileNameOverrides })
    .then(function(count) {
        core.setOutput('count', count.toString());
    })
    .catch(function(error) {
        core.setFailed((error && error.message) || error || "Unknown error");
    });
