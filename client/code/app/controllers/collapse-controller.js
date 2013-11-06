"use strict";

// Retrieve the app module so we can add controllers to it.
var MOD_app = angular.module('app');

// CollapseCtrl - Global Collapse page
MOD_app.controller('CollapseCtrl', ['$scope', 'inputService', 'colorService', 'pathService', 'textParser', 'distService',
		function($scope, inputService, colorService, pathService, textParser, distService) {
	
	// Enums
	$scope.PARAMETRIC = 'LogNormalModel';
	$scope.DISCRETE = 'DiscreteModel';
	$scope.AUTOMATIC = 'Automatic';
	$scope.MANUAL = 'Manual';
	
	$scope.demoCollapse = inputService.getDemoCollapse();
	
	$scope.relationshipType = null;
	// Initialize the relationship type from the model.
	// For now, we use either parametric or discrete for all the relationships,
	// but the model can have relationships with different types. So here, we
	// just take the type of the first relationship in the array.
	if ($scope.demoCollapse && _.size($scope.demoCollapse.demoRelationships) > 0) {
		$scope.relationshipType = $scope.demoCollapse.demoRelationships[0].model.type;
	} else if ($scope.demoCollapse && _.size($scope.demoCollapse.collapseRelationships) > 0) {
		$scope.relationshipType = $scope.demoCollapse.collapseRelationships[0].model.type;
	}
	
	// Parameters for parametric (log-normal) model for demolition
	$scope.demolition_mean = null;
	$scope.demolition_sd = null;
	
	// Parameters for parametric (log-normal) model for collapse
	$scope.collapse_mean = null;
	$scope.collapse_sd = null;
	
	$scope.im = inputService.getIm();
	
	$scope.demolitionRelationships = $scope.demoCollapse.demoRelationships;
	$scope.collapseRelationships = $scope.demoCollapse.collapseRelationships;
	$scope.graphData = {
		xAxisLabel: $scope.im.name,
		yAxisLabel: 'Probability of Collapse',
		lines: []
	};
	
	// Watch for relationship changes
	$scope.$watch('demolitionRelationships.length + collapseRelationships.length', function(n, o) {
		$scope.displayChart();
	});
	
	// Update the chart with the currently selected relationship.
	$scope.displayChart = function() {
		var lines = [];
		var colorMap = colorService.makeColorMap();
		// Demolition relationships
		for (var i = 0; i < $scope.demolitionRelationships.length; ++i) {
			var rel = $scope.demolitionRelationships[i];
			if (rel.model.type == $scope.DISCRETE) {
				lines.push($scope.makeDiscreteLine('Demolition Rel ' + (i + 1), rel.model.points, colorMap));
			} else if (rel.model.type == $scope.PARAMETRIC) {
				lines.push($scope.makeLogNormalLine('Demolition Rel ' + (i + 1), rel.model.mean, rel.model.sd, colorMap));
			}
		}
		// Collapse relationships
		for (var i = 0; i < $scope.collapseRelationships.length; ++i) {
			var rel = $scope.collapseRelationships[i];
			if (rel.model.type == $scope.DISCRETE) {
				lines.push($scope.makeDiscreteLine('Collapse Rel ' + (i + 1), rel.model.points, colorMap));
			} else if (rel.model.type == $scope.PARAMETRIC) {
				lines.push($scope.makeLogNormalLine('Collapse Rel ' + (i + 1), rel.model.mean, rel.model.sd, colorMap));
			}
		}
		$scope.graphData.lines = lines;
	};
	
	$scope.makeLogNormalLine = function(name, mean, sd, colorMap) {
		var meanln = Math.log(mean) - sd*sd/2.0;
		var x_lowerlimit = Math.max(0.000001, Math.exp(meanln - sd*4));
		var x_upperlimit = Math.exp(meanln + sd*4);
		
		// TODO: Figure out limits somehow
		//var x_lowerlimit = 0;
		//var x_upperlimit = 5;

		return {
			"name": name,
			"isDiscrete": false,
			"func": function(i) {
				return distService.lognormalCumulativeProbability(i, meanln, sd);
			},
			"color": colorMap.getNextColor(),
			"limits": {
				xmin: x_lowerlimit,
				xmax: x_upperlimit,
				ymin: 0.0,
				ymax: 1.0
			},
		};
	};
	
	$scope.makeDiscreteLine = function(name, points, colorMap) {
		return {
			"name": name,
			"isDiscrete": true,
			"data": points,
			"color": colorMap.getNextColor()
		};
	};
	
	$scope.removeDemolitionRel = function(idx) {
		$scope.demolitionRelationships.splice(idx, 1);
	};
	
	$scope.removeCollapseRel = function(idx) {
		$scope.collapseRelationships.splice(idx, 1);
	};
	
	$scope.demolitionFormValid = function() {
		return $scope.demolition_mean != null && $scope.demolition_sd != null;
	};
	
	$scope.addDemolitionRelationship = function() {
		$scope.demolitionRelationships.push({
			name: 'Mean: ' + $scope.demolition_mean + ', Log-normal SD: ' + $scope.demolition_sd,
			epistemicWeight: 1.0,
			model: {
				type: $scope.PARAMETRIC,
				mean: parseFloat($scope.demolition_mean),
				sd: parseFloat($scope.demolition_sd)
			}
		});
		$scope.demolition_mean = null;
		$scope.demolition_sd = null;
	};
	
	$scope.collapseFormValid = function() {
		return $scope.collapse_mean != null && $scope.collapse_sd != null;
	};
	
	$scope.addCollapseRelationship = function() {
		$scope.collapseRelationships.push({
			name: 'Mean: ' + $scope.collapse_mean + ', Log-normal SD: ' + $scope.collapse_sd,
			epistemicWeight: 1.0,
			model: {
				type: $scope.PARAMETRIC,
				mean: parseFloat($scope.collapse_mean),
				sd: parseFloat($scope.collapse_sd)
			}
		});
		$scope.collapse_mean = null;
		$scope.collapse_sd = null;
	};
	
	// Called when the user selects a new discrete relationship file.
	$scope.handleFileSelect = function(elemid, relarray, event) {
		$scope.$apply(function($scope) {
			var f = event.target.files[0];
			if (f) {
				var filename = pathService.extractFilename(event.target.value);
				var r = new FileReader();
				r.onload = function(e) {
					$scope.$apply(function($scope) {
						try {
							var results = textParser.parse(e.target.result);
							relarray.push({
								name: filename,
								epistemicWeight: 1.0,
								model: {
									type: $scope.DISCRETE,
									points: results.points
								}
							});
							
							// Now replace the file input with a new, identical one.
							var oldInput = document.getElementById(elemid); 
							var newInput = document.createElement('input');
							newInput.type = 'file';
							newInput.id = oldInput.id;
							oldInput.parentNode.replaceChild(newInput, oldInput);
							// Listen for changes on the new node
							document.getElementById(elemid).addEventListener('change', _.partial($scope.handleFileSelect, elemid, relarray));
						} catch (err) {
							alert("Error: Invalid file format.");
						}
					});
				};
				r.readAsText(f);
			}
		});
	};
	
	document.getElementById('demoFileSelect').addEventListener('change', _.partial($scope.handleFileSelect, 'demoFileSelect', $scope.demolitionRelationships));
	
	document.getElementById('collapseFileSelect').addEventListener('change', _.partial($scope.handleFileSelect, 'collapseFileSelect', $scope.collapseRelationships));
}]);
