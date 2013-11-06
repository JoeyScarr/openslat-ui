// This file automatically gets called first by SocketStream and must always exist
// Make 'ss' available to all modules and the browser console
window.ss = require('socketstream');

// these are standalone angular modules
require('/services.js');
require('/directives.js');
require('/chart.js');

// this is the angular application
var modules = [
	'app.services',
	'app.directives',
	'chart',
	'$strap'
];

var app = angular.module('app', modules);

// configure angular routing
require('/routes.js')(app);

// setup angular controllers
require('/controllers/controllers-main.js');
require('/controllers/im-controller.js');
require('/controllers/edp-controller.js');
require('/controllers/structure-controller.js');
require('/controllers/collapse-controller.js');
require('/controllers/results-controller.js');

ss.server.on('disconnect', function () {
	$('#warning').modal('show');
});

ss.server.on('reconnect', function () {
	$('#warning').modal('hide');
});
