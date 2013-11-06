"use strict";

// Retrieve the app module so we can add controllers to it.
var MOD_app = angular.module('app');

// ImCtrl - Im page
MOD_app.controller('ImCtrl', ['$scope', 'inputService', 'pathService', 'colorService', 'textParser', function($scope, inputService, pathService, colorService, textParser) {

	$scope.im = inputService.getIm();
	$scope.options = inputService.getCalculationOptions();
	
	$scope.graphData = {
		xAxisLabel: '',
		yAxisLabel: 'Mean Annual Rate of Exceedance',
		xScale: 'log',
		yScale: 'log',
		lines: []
	};
	
	// Enums
	$scope.PARAMETRIC = 'Parametric';
	$scope.DISCRETE = 'IMRDiscreteModel';
	$scope.POWERMODEL = 'PowerModel';
	$scope.HYPERBOLICMODEL = 'HyperbolicModel';
	
	$scope.relationshipType = null;
	$scope.parametricType = null;
	
	// Parametric, power params
	$scope.power_k0 = 2.2;
	$scope.power_k = 2.3;
	
	// Parametric, hyperbolic params
	$scope.hyperbolic_vasy = 1221;
	$scope.hyperbolic_IMasy = 27;
	$scope.hyperbolic_alpha = 65;
	
	// Discrete relationships
	$scope.discreteRelationships = [];
	
	// Initialize view to model
	if (!!$scope.im && !!$scope.im.relationships && $scope.im.relationships.length > 0) {
		var model = $scope.im.relationships[0].model;
		if (model.type == $scope.DISCRETE) {
			$scope.relationshipType = $scope.DISCRETE;
			$scope.discreteRelationships = $scope.im.relationships;
		} else {
			$scope.relationshipType = $scope.PARAMETRIC;
			$scope.parametricType = model.type;
			if (model.type == $scope.HYPERBOLICMODEL) {
				$scope.hyperbolic_vasy = model.parameters[0];
				$scope.hyperbolic_IMasy = model.parameters[1];
				$scope.hyperbolic_alpha = model.parameters[2];
			} else if (model.type == $scope.POWERMODEL) {
				$scope.power_k0 = model.parameters[0];
				$scope.power_k = model.parameters[1];
			}
		}
	}
	
	// Watch for changes in the relationship type
	$scope.$watch('relationshipType', function(newVal, oldVal) {
		$scope.displayChart(newVal, $scope.parametricType);
		$scope.updateIM();
	}, true);
	$scope.$watch('parametricType', function(newVal, oldVal) {
		$scope.displayChart($scope.relationshipType, newVal);
		$scope.updateIM();
	}, true);
	
	// Watch for parameter changes
	$scope.$watch('power_k0 + power_k + hyperbolic_vasy + hyperbolic_IMasy + hyperbolic_alpha', function(n, o) {
		$scope.displayChart($scope.relationshipType, $scope.parametricType);
		$scope.updateIM();
	});
	
	// Watch for discrete relationship changes
	$scope.$watch('discreteRelationships.length', function(n, o) {
		$scope.displayChart($scope.relationshipType, $scope.parametricType);
		$scope.updateIM();
	});
	
	// Watch for IM name changes
	$scope.$watch('im.name', function(newName, oldName) {
		$scope.graphData.xAxisLabel = newName;
	});
	
	// Update the chart with the currently selected relationship.
	$scope.displayChart = function(relationshipType, parametricType) {
		var colorMap = colorService.makeColorMap();
		if (relationshipType == $scope.PARAMETRIC) {
			if (parametricType == $scope.POWERMODEL) {
				var line = $scope.makePowerModelLine($scope.power_k0, $scope.power_k, colorMap);
				$scope.graphData.lines = [line];
			} else if (parametricType == $scope.HYPERBOLICMODEL) {
				var line = $scope.makeHyperbolicModelLine($scope.hyperbolic_vasy, $scope.hyperbolic_IMasy, $scope.hyperbolic_alpha, colorMap);
				$scope.graphData.lines = [line];
			}
		} else if (relationshipType == $scope.DISCRETE) {
			var lines = [];
			for (var i = 0; i < $scope.discreteRelationships.length; ++i) {
				lines.push($scope.makeDiscreteLine('Relationship ' + (i + 1), $scope.discreteRelationships[i].model.points, colorMap));
			}
			$scope.graphData.lines = lines;
		}
	};
	
	// Determines whether the IM relationship is complete.
	$scope.isIMComplete = function() {
		if ($scope.relationshipType == $scope.PARAMETRIC) {
			if ($scope.parametricType == $scope.POWERMODEL) {
				return $scope.power_k0 != null && $scope.power_k != null;
			} else if ($scope.parametricType == $scope.HYPERBOLICMODEL) {
				return $scope.hyperbolic_vasy != null && $scope.hyperbolic_IMasy != null && $scope.hyperbolic_alpha != null;
			}
		} else if ($scope.relationshipType == $scope.DISCRETE) {
			return $scope.discreteRelationships.length > 0;
		}
		return false;
	};
	
	// Update the IM in the JSON object with the currently entered data.
	$scope.updateIM = function() {
		if ($scope.relationshipType == $scope.PARAMETRIC) {
			if ($scope.parametricType == $scope.POWERMODEL) {
				$scope.im.relationships = [{
					name: 'Power Model',
					epistemicWeight: 1.0,
					model: {
						"type": $scope.POWERMODEL,
						"parameters": [$scope.power_k0, $scope.power_k]
					}
				}];
			} else if ($scope.parametricType == $scope.HYPERBOLICMODEL) {
				$scope.im.relationships = [{
					name: 'Hyperbolic Model',
					epistemicWeight: 1.0,
					model: {
						"type": $scope.HYPERBOLICMODEL,
						"parameters": [$scope.hyperbolic_vasy, $scope.hyperbolic_IMasy, $scope.hyperbolic_alpha]
					}
				}];
			}
		} else if ($scope.relationshipType == $scope.DISCRETE) {
			$scope.im.relationships = $scope.discreteRelationships;
		}
	};

	$scope.makePowerModelLine = function(k0, k, colorMap) {
		var func = function(x) {
			return k0 / Math.pow(x, k);
		};
		var xmin = Math.exp(-5.5);
		var xmax = Math.exp(0.5);
		// TODO: Calculate these properly rather than using constants
		return {
			"name": 'Power Model',
			"isDiscrete": false,
			"func": func,
			"color": colorMap.getNextColor(),
			"limits": {
				xmin: xmin,
				xmax: xmax,
				ymin: Math.min(func(xmin),func(xmax)),
				ymax: Math.max(func(xmin),func(xmax))
			}
		};
	};

	$scope.makeHyperbolicModelLine = function(vasy, IMasy, alpha, colorMap) {
		var func = function(x) {
			return vasy * Math.exp(alpha / (Math.log(x / IMasy)));
		};
		// TODO: Calculate these properly rather than using constants
		var xmin = Math.exp(-5.5);
		var xmax = Math.exp(0.5);
		return {
			"name": 'Hyperbolic Model',
			"isDiscrete": false,
			"func": func,
			"color": colorMap.getNextColor(),
			"limits": {
				xmin: xmin,
				xmax: xmax,
				ymin: Math.min(func(xmin),func(xmax)),
				ymax: Math.max(func(xmin),func(xmax))
			}
		};
	};
	
	$scope.makeDiscreteLine = function(name, points, colorMap) {
		return {
			"name": name,
			"data": points,
			"isDiscrete": true,
			"color": colorMap.getNextColor()
		};
	};
	
	$scope.removeDiscreteRel = function(idx) {
		$scope.discreteRelationships.splice(idx, 1);
	};
	
	// Called when the user selects a new discrete relationship file.
	$scope.handleFileSelect = function(event) {
		$scope.$apply(function($scope) {
			var f = event.target.files[0];
			if (f) {
				var filename = pathService.extractFilename(event.target.value);
				var r = new FileReader();
				r.onload = function(e) {
					$scope.$apply(function($scope) {
						try {
							var results = textParser.parse(e.target.result);
							$scope.discreteRelationships.push({
								name: filename,
								epistemicWeight: 1.0,
								model: {
									type: $scope.DISCRETE,
									points: results.points
								}
							});
							
							// Now replace the file input with a new, identical one.
							var oldInput = document.getElementById('imFileSelect'); 
							var newInput = document.createElement('input');
							newInput.type = 'file';
							newInput.id = oldInput.id;
							oldInput.parentNode.replaceChild(newInput, oldInput);
							// Listen for changes on the new node
							document.getElementById('imFileSelect').addEventListener('change', $scope.handleFileSelect);
						} catch (err) {
							alert("Error: Invalid file format.");
						}
					});
				};
				r.readAsText(f);
			}
		});
	};
	
	document.getElementById('imFileSelect').addEventListener('change', $scope.handleFileSelect);
}]);
