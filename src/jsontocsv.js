const fs = require('fs')
const path = require('path')
const yargs = require('yargs')



const jsontocsv = (...args) => {

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
.option('suppress', {
	alias: 's',
	default: false,
	describe: 'Suppresses full report of tests run',
	type: 'boolean'
})
.argv

// Receives a JSON output from wdio-json-reporter and converts selected elements to CSV. Ouputs to STDOUT.

const dir = argv.directory

// Load webdriver merged output JSON file into var.
const jsonInput = args[0] || argv.file;
const suppress = argv.suppress;

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
out.push('"uniqueId","scriptId","testId","suiteName","browserName","platformName","deviceName","orientation","testName","state","errorType","error","start","end","duration"');

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
		// scriptList.push(scriptId);
		var tests = suite.tests;
		for (test of tests) {
			var testName = test.name;
			var duration = test.duration;
			var state = test.state;
			var errorType = checkExist(test.errorType);
			var error = checkExist(test.error).replace(/\n/g," | ");
			var ids = constructUID(suiteName, testName, browserName, platformName, deviceName)
			var uniqueId = ids.uid
			var scriptId = ids.scriptId
			var testId = ids.testId
			var suiteEls = [uniqueId, scriptId, testId, suiteName, browserName, platformName, deviceName, orientation, testName, state, errorType, error, startTime, endTime, duration];
			line = '"' + suiteEls.join('","') + '"' ;
			out.push(line);
		}
	}
}
// Output
csv = out.join('\n');

if (!suppress) {
	console.log(csv);
}

if (dir) {
		// If directory parameter has been set, also output list of scripts that haven't run
		console.log(`\n\n"EXCEPTIONS NOT RUN"`);
		const scriptFiles = getFileList(dir, true);
		let exceptions = arrayDiff(scriptFiles, scriptList);
		exceptions = exceptions.join("\n");
		console.log(exceptions); // append list of files not run due to connection drop to end of report.
	}
}

function getFileList(dir) {
	// Get list of files from specified directory
	const fileNames = fs.readdirSync(dir);
	let fileArray = [];
	var i = 0;
	fileNames.forEach(fileName => {
		fileArray.push(fileName.replace(/\..*/g, ""));
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

function constructUID (scriptName, testName, browserName, platformName, deviceName) {
	// Construct uinique identifier for reports, combining suite, test and capabilities details.
	var scriptId = scriptName.match(/(?<=^T)[0-9]+/);
	if (scriptId !== null) {
		scriptId = scriptId.toString();
		scriptId = "T" + scriptId.padStart(2, 0);
	} else {
		scriptId = "";
	}
	let shouldAssert = testName.match(/^S[0-9]+/g)[0];

	let browserPfx = makePrefix(browserName);
	let platformPfx = makePrefix(platformName);
	let devicePfx = makePrefix(deviceName);

	let uid = `${scriptId}:${shouldAssert}:${browserPfx}:${platformPfx}:${devicePfx}`;

	return {
		"uid": uid,
		"scriptId": scriptId,
		"testId": shouldAssert
	};

	function makePrefix(str) {
		let pfx = "";
		if(str) {
			pfx = str.match(/^.{3}/g).toString();
		} else {
			pfx = "";
		}
		return pfx;
	}
};

module.exports = jsontocsv;