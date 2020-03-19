const fs = require('fs')
const path = require('path')
const yargs = require('yargs')

// Command line arguments from yargs
const argv = yargs
.option('directory', {
  alias: 'd',
  describe: 'Directory containing test scripts',
  type: 'string'
})
.option('file', {
  alias: 'f',
  default: './manifest.json',
  describe: 'File path to JSON file for converting',
  type: 'string'
})
.argv

const jsontocsv = (...args) => {
// Receives a JSON output from wdio-json-reporter and converts selected elements to CSV. Ouputs to STDOUT.

const dir = argv.directory
const scriptFiles = getFileList(dir);

// Load webdriver merged output JSON file into var.
const jsonInput = args[0] || argv.file;
let runs = JSON.parse(fs.readFileSync(jsonInput));

/* Behaviour to handle if only one report JSON file is in scope rather than several merged objects.
If it's a single object, create an empty array for processing and push the file contents as the first element. */

if (!runs.length) {
	runs = []
	runs.push(JSON.parse(fs.readFileSync(jsonInput)))
}

// Array to hold output.
var out = [];
var scriptList = []; // to hold list of script IDs to compare to files
// Header row
out.push('"scriptId","suiteName","start","end","browserName","platformName","deviceName","orientation","testName","duration","state","errorType","error"');

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
		scriptList.push(scriptId);
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
console.log(`"EXCEPTIONS NOT RUN"`);
let exceptions = arrayDiff(scriptFiles, scriptList);
exceptions = exceptions.join("\n");
console.log(exceptions); // append list of files not run due to connection drop to end of report.
}

function getFileList(dir) {
	// Get list of files from specified directory
	const fileNames = fs.readdirSync(dir);
	let fileArray = [];
	var i = 0;
	fileNames.forEach(fileName => {
		console.log(fileName);
		fileArray.push(fileName);
	});
	return fileArray;
}

function arrayDiff(arrX, arrY) {
  // returns elements in array X that do not appear in array Y
  arrDiff = arrX.filter(elX => !arrY.includes(elX));
  return arrDiff;
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