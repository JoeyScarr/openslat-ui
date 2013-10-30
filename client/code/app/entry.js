// This file automatically gets called first by SocketStream and must always exist
// Make 'ss' available to all modules and the browser console
window.ss = require('socketstream');

// these are standalone angular modules
require('/services');
require('/directives');
require('/chart');

// this is the angular application
var modules = [
	'app.services',
	'app.directives',
	'chart',
	'$strap'
];

var app = angular.module('app', modules);

// configure angular routing
require('/routes')(app);

// setup angular controllers
require('/controllers')(app);

ss.server.on('disconnect', function () {
	$('#warning').modal('show');
});

ss.server.on('reconnect', function () {
	$('#warning').modal('hide');
});
