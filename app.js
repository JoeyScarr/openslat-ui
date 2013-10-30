/**
 * This file defines the ExpressJS/Socketstream app.
 */

var express = require('express'),
	ss = require('socketstream'),
	fs = require('fs'),
	path = require('path'),
	server,
	app = express(),
	conf = require('./conf');

app.use(express.bodyParser());

// Define a single-page client called 'main'
ss.client.define('main', {
	view: 'app.html',
	css: ['libs', 'main.css', 'chart.css', 'forms.css'],
	code: ['libs', 'app'],
	tmpl: '*'
});

ss.client.templateEngine.use('angular');


/*******************************************************************************
 * REQUEST HANDLERS
 ******************************************************************************/
var exec = require('child_process').exec;
var child;
var calculating = false;
var calc_result = null;

// A POST request to /calculate sends the input data for calculation
app.post('/calculate', function(req, res) {
	if (calculating) {
		res.send(500, 'ERROR: Calculation already in progress');
	} else {
		calculating = true;
		
		// Start the JAR
		child = exec('java -jar openslat.jar',
			function (error, stdout, stderr) {
				console.log('stdout: ' + stdout);
				console.log('stderr: ' + stderr);
				if (error !== null) {
					console.log('exec error: ' + error);
				}
				calc_result = stdout;
		});
		var json = JSON.stringify(req.body);
		console.log(json);
		child.stdin.write(json+"\n");
		child.stdin.end();
		res.send('Data received');
	}
});

// A GET request to /calculate checks the calculation status
app.get('/calculate', function(req, res) {
	if (calculating) {
		if (calc_result != null) {
			res.send(calc_result);
			calculating = false;
			calc_result = null;
		} else {
			res.send('calculating');
		}
	} else {
		res.send(500, 'ERROR: No calculation in progress')
	}
});

// A GET request to /getff requests the list of fragility functions
app.get('/getff', function (req, res) {
	fs = require('fs');
	fs.readFile('data/ff.json', 'utf8', function(err,data){
		if (err) { return console.log(err); }
		res.writeHead(200, {'Content-Type': 'application/json'});
		res.write(data);
		res.end();
		return res;
	});
});

// catch-all request handler
app.get('/*', function (req, res) {
	res.serveClient('main');
});

// start 'er up
server = app.listen(conf.webServer.port, function () {
	console.log('web server listening on port %d in %s mode', conf.webServer.port, ss.env);
});
ss.start(server);

// append socketstream middleware
app.stack = ss.http.middleware.stack.concat(app.stack);

process.on('uncaughtException', function(err) {
	console.log('Caught exception: ' + err);
});
