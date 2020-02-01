const fs = require('fs')
const path = require('path')

const jsontocsv = (...args) => {
// Receives a JSON output from wdio-json-reporter and converts selected elements to CSV. Ouputs to STDOUT.

// Load webdriver merged output JSON file into var.
const jsonInput = args[0] || process.argv[2];
const runs = JSON.parse(fs.readFileSync(jsonInput));

// Array to hold output.
var out = [];
// Header row
out.push('"scriptId","suiteName","start","end","browserName","platformName","platform","deviceName","orientation","testName","duration","state","errorType","error"');

for (run of runs ) {
	var startTime = run.start;
	var endTime = run.end;
	var browserName = checkExist(run.capabilities.browserName);
	var platformName = run.capabilities.platformName;
	// Select platform name based on which variant of field is populated.
	platformName = typeof(platformName) !== 'undefined' ? platformName : run.capabilities.platform
	var deviceName = checkExist(run.capabilities.deviceName);
	var orientation = checkExist(run.capabilities.orientation);
	var suites = run.suites;
	for (suite of suites) {
		var suiteName = suite.name;
		var scriptId = constructScriptId(suiteName);
		var tests = suite.tests;
		for (test of tests) {
			var testName = test.name;
			var duration = test.duration;
			var state = test.state;
			var errorType = checkExist(test.errorType);
			var error = checkExist(test.error);
			var suiteEls = [scriptId, suiteName, startTime, endTime, browserName, platformName, deviceName, orientation, testName, duration, state, errorType, error];
			line = '"' + suiteEls.join('","') + '"' ;
			out.push(line);
		}
	}
}
// Output
csv = out.join('\n');
console.log(csv);
}

function checkExist(e) {
	// Check if attribute exists in JS object and return empty string if not
	if (typeof(e) == 'undefined') {
		return "";
	} else {
		return e;
	}
}

function constructScriptId (scriptName) {
var scriptId = scriptName.match(/(?<=^T)[0-9]+/);
	if (scriptId !== null) {
		scriptId = scriptId.toString();
		scriptId = "T" + scriptId.padStart(2, 0);
	} else {
		scriptId = "";
	}
	return scriptId;
};

module.exports = jsontocsv;