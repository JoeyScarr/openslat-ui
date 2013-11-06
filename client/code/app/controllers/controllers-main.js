"use strict";

// Retrieve the app module so we can add controllers to it.
var MOD_app = angular.module('app');

// AppCtrl - top-level routing stuff
MOD_app.controller('AppCtrl', ['$scope', '$route', '$routeParams', function($scope, $route, $routeParams) {

	var render = function() {
			// action is something like 'home.view'
			var action = $route.current.action,
				// path becomes ['home', 'view']
				path = (action && action.split('.')) || [];

			// you can use path array to build more complex
			// views within views by having a hierarchy defined

			$scope.action = action;
			$scope.path = path;

			$scope.isHome = (path[0] === 'home');
			$scope.isIntroduction = (path[0] === 'introduction');
			$scope.isOptions = (path[0] === 'options');
			$scope.isIm = (path[0] === 'im');
			$scope.isEdp = (path[0] === 'edp');
			$scope.isStructure = (path[0] === 'structure');
			$scope.isCollapse = (path[0] === 'collapse');
			$scope.isFf = (path[0] === 'ff');
			$scope.isResults = (path[0] === 'results');
		};

	// updates whenever route changes
	$scope.$on('$routeChangeSuccess', function(scope, next, current) {
		render();
	});
}]);

// SaveCtrl - handles saving and loading the JSON data
MOD_app.controller('SaveCtrl', ['$scope', '$timeout', 'inputService', '$location',
																 function($scope, $timeout, inputService, $location) {
	
	$scope.dirty = true;
	$scope.oldJSON = inputService.getJSONCopy();
	
	/*$scope.$watch('inputService.getJSON()', function() {
		$scope.dirty = true;
	});*/
	
	var updateDirtyFlag = function() {
		var newJSON = inputService.getJSONCopy();
		if (!angular.equals($scope.oldJSON, newJSON)) {
			$scope.oldJSON = newJSON;
			$scope.dirty = true;
		}
		$timeout(updateDirtyFlag, 1000);
	};
	
	$timeout(updateDirtyFlag, 1000);
	
	$scope.saveJson = function() {
		var text = inputService.getJSONString();
		
		var blob = new Blob([text], {type: "text/plain;charset=utf-8"});
		saveAs(blob, "saved_data.openslat");
		$scope.dirty = false;
	};
	
	// Called when the user loads a save file.
	$scope.handleFileSelect = function(event) {
		$scope.$apply(function($scope) {
			var f = event.target.files[0];
			if (f) {
				var r = new FileReader();
				r.onload = function(e) {
					$scope.$apply(function($scope) {
						try {
							inputService.setJSON(e.target.result);
							$scope.oldJSON = inputService.getJSONCopy();
							
							$scope.dirty = false;
							
							// Now replace the file input with a new, identical one.
							var oldInput = document.getElementById('saveFileSelect'); 
							var newInput = document.createElement('input');
							newInput.type = 'file';
							newInput.id = oldInput.id;
							oldInput.parentNode.replaceChild(newInput, oldInput);
							// Listen for changes on the new node
							document.getElementById('saveFileSelect').addEventListener('change', $scope.handleFileSelect);
							
							// Now refresh the page.
							$location.path('/#');
						} catch (err) {
							alert("Error: Invalid file format.");
						}
					});
				};
				r.readAsText(f);
			}
		});
	};
	
	document.getElementById('saveFileSelect').addEventListener('change', $scope.handleFileSelect);
}]);

// NavCtrl - bootstrap top-level navbar
MOD_app.controller('NavCtrl', ['$scope', '$location', function($scope, $location) {

	$scope.isActive = function(clicked) {
		if (!clicked) {
			return '';
		}
		var path = $location.path(),
			location = (path) ? path.substring(1) : '';

		return location === clicked ? 'active' : '';
	};

}]);
