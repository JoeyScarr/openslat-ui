#OpenSLAT: Earthquake Engineering Value-At-Risk Software

This software calculates the financial and life-safety risk for commercial buildings in New Zealand,
part of the design and risk assessment process for new buildings.

##Developing:
OpenSLAT is based on three components: the backend calculator (incomplete, and not included in this repo), the server (based on Node.js), and the UI (written in HTML, Javascript and [AngularJS](http://angularjs.org/)).

In order to set up a local development server, you will need to install [Node.js](http://nodejs.org/).
After cloning the repo, you will need to run `npm install` from the root directory.

The server can be started with the command:

	node app.js

Then in a web browser, visit [http://localhost:8080/](http://localhost:8080/)

##Testing:
Unit and integration tests are yet to be written.

##Screenshots:
<div><img title="screenshot 1" src="https://dl.dropboxusercontent.com/u/128539/openslat_github_1.png" align=center height = 300 /></div>
<div><img title="screenshot 1" src="https://dl.dropboxusercontent.com/u/128539/openslat_github_2.png" align=center height = 300 /></div>
