"use strict";

// Retrieve the app module so we can add controllers to it.
var MOD_app = angular.module('app');

// EdpCtrl - Response page
MOD_app.controller('EdpCtrl', ['$scope', 'inputService', 'pathService', 'textParser',
																function($scope, inputService, pathService, textParser) {
	
	$scope.PARAMETRIC = 'LogNormalModel';
	$scope.DISCRETE = 'EDPIMDiscreteModel';
	$scope.POWERMODEL = 'PowerModel';
	$scope.HYPERBOLICMODEL = 'HyperbolicModel';
	$scope.ASLANIMODEL = 'AslaniModel';
	$scope.PARABOLICMODEL = 'ParabolicModel';
	$scope.MEANSDFORMAT = 'MeanDispersion';
	$scope.RAWDATAFORMAT = 'RawData';
	
	$scope.im = inputService.getIm();
	$scope.edps = inputService.getEdps();
	$scope.options = inputService.getCalculationOptions();

	$scope.edpid = null;
	$scope.edpname = '';
	$scope.relationshipType = '';
	$scope.meanParametricType = '';
	$scope.sdParametricType = '';
	$scope.discreteInputFormat = '';
	
	// Discrete data
	$scope.discreteData = null;
	$scope.extraPoints = null;
	
	// Mean parameters
	$scope.meanpower_a = null;
	$scope.meanpower_b = null;
	$scope.meanaslani_a1 = null;
	$scope.meanaslani_a2 = null;
	$scope.meanaslani_a3 = null;
	// Dispersion (s.d.) parameters
	$scope.sdpower_a = '';
	$scope.sdpower_b = '';
	$scope.sdparabolic_b1 = '';
	$scope.sdparabolic_b2 = '';
	$scope.sdparabolic_b3 = '';
	
	// Output range data
	$scope.minEDPValue = 0;
	$scope.maxEDPValue = 1;
	
	// Graph data
	$scope.newEdpGraphData = {
		xAxisLabel: $scope.im.name,
		yAxisLabel: $scope.edpname,
		lines: []
	};
	
	// Watch for IM name changes
	$scope.$watch('im.name', function(newName, oldName) {
		$scope.newEdpGraphData.xAxisLabel = newName;
	});
	
	// Watch for EDP name changes
	$scope.$watch('edpname', function(newName, oldName) {
		$scope.newEdpGraphData.yAxisLabel = newName;
	});
	
	// Watch for discrete data changes
	$scope.$watch('discreteData', function(n, o) {
		$scope.displayChart($scope.relationshipType, $scope.meanParametricType, $scope.sdParametricType);
	});
	
	// Watch for parameter changes
	$scope.$watch('meanpower_a + meanpower_b + meanaslani_a1 + meanaslani_a2 + meanaslani_a3 + sdpower_a + sdpower_b + sdparabolic_b1 + sdparabolic_b2 + sdparabolic_b3', function(n, o) {
		$scope.displayChart($scope.relationshipType, $scope.meanParametricType, $scope.sdParametricType);
	});
	
	// Update the chart with the currently selected relationship.
	$scope.displayChart = function(relationshipType, meanParametricType, sdParametricType) {
		var lines = [];
		if (relationshipType == $scope.DISCRETE) {
			if ($scope.discreteData != null) {
				// Iterate over the discrete data and convert it into three lines.
				var meanline = {
					name: "Mean",
					isDiscrete: true,
					data: []
				};
				var upper = {
					name: "84th percentile",
					isDiscrete: true,
					data: []
				};
				var lower = {
					name: "16th percentile",
					isDiscrete: true,
					data: []
				};
				
				for (var i = 0; i < $scope.discreteData.length; ++i) {
					var datum = $scope.discreteData[i];
					meanline.data.push([datum[0], datum[1]]);
					var mu = datum[1];
					var sigma = datum[2];
					var x84 = mu*Math.exp(sigma-sigma*sigma/2.0);
					var x16 = mu*Math.exp(-sigma-sigma*sigma/2.0);
					upper.data.push([datum[0], x84]);
					lower.data.push([datum[0], x16]);
				}
				
				// If there are extra points to display, process them and add to the mean line.
				if (!!$scope.extraPoints) {
					meanline.extraPoints = [];
					for (var i = 0; i < $scope.extraPoints.length; ++i) {
						var pointarray = $scope.extraPoints[i];
						for (var j = 1; j < pointarray.length; ++j) {
							// Skip zero measurements
							if (pointarray[j] == 0) {
								continue;
							}
							meanline.extraPoints.push([pointarray[0], pointarray[j]]);
						}
					}
				}
				
				lines.push(upper);
				lines.push(meanline);
				lines.push(lower);
			}
		} else if (relationshipType == $scope.PARAMETRIC) {
			var func = null;
			if (meanParametricType == $scope.POWERMODEL && $scope.meanpower_a != '' && $scope.meanpower_b != '') {
				func = function(x) {
					return $scope.meanpower_a * Math.pow(x, $scope.meanpower_b);
				};
			} else if (meanParametricType == $scope.ASLANIMODEL && $scope.meanaslani_a1 != '' && $scope.meanaslani_a2 != '' && $scope.meanaslani_a3 != '') {
				func = function(x) {
					return $scope.meanaslani_a1 * Math.pow($scope.meanaslani_a2, x) * Math.pow(x, $scope.meanaslani_a3);
				};
			}
			// If there's a mean line and we've defined dispersion, add lines for that too
			if (func != null) {
				// TODO: Calculate these properly rather than using constants
				var xmin = Math.exp(-5.5);
				var xmax = Math.exp(0);
				var sdfunc = null;
				if (sdParametricType == $scope.POWERMODEL && $scope.sdpower_a != '' && $scope.sdpower_b != '') {
					sdfunc = function(x) {
						return $scope.sdpower_a * Math.pow(x, $scope.sdpower_b);
					};
				} else if (sdParametricType == $scope.PARABOLICMODEL && $scope.sdparabolic_b1 != '' && $scope.sdparabolic_b2 != '' && $scope.sdparabolic_b3 != '') {
					sdfunc = function(x) {
						return parseFloat($scope.sdparabolic_b1) + $scope.sdparabolic_b2 * x + $scope.sdparabolic_b3 * x * x;
					};
				}
				if (sdfunc != null) {
					lines.push($scope.makeParametricLine("84th percentile", function(x) {
						var mu = func(x);
						var sigma = sdfunc(x);
						var x84 = mu * Math.exp(sigma - sigma*sigma/2.0);
						return x84;
					}, xmin, xmax));
				}
				lines.push($scope.makeParametricLine("Parametric relationship", func, xmin, xmax));
				if (sdfunc != null) {
					lines.push($scope.makeParametricLine("16th percentile", function(x) {
						var mu = func(x);
						var sigma = sdfunc(x);
						var x16 = mu * Math.exp(-sigma - sigma*sigma/2.0);
						return x16;
					}, xmin, xmax));
				}
			}
		}
		$scope.newEdpGraphData.lines = lines;
		
	};
	
	$scope.makeParametricLine = function(name, func, xmin, xmax) {
		return {
			"name": name,
			"isDiscrete": false,
			"func": func,
			"limits": {
				xmin: xmin,
				xmax: xmax,
				ymin: Math.min(func(xmin),func(xmax)),
				ymax: Math.max(func(xmin),func(xmax))
			}
		};
	};
	
	$scope.newEdpValid = function() {
		if (!$scope.edpname) { return false; }
		if ($scope.relationshipType == $scope.PARAMETRIC) {
			var valid = true;
			if ($scope.meanParametricType == $scope.POWERMODEL) {
				valid = valid && $scope.meanpower_a !== '' && $scope.meanpower_b !== '';
			} else if ($scope.meanParametricType == $scope.ASLANIMODEL) {
				valid = valid && $scope.meanaslani_a1 !== '' && $scope.meanaslani_a2 !== '' && $scope.meanaslani_a3 !== '';
			} else {
				valid = false;
			}
			
			if ($scope.sdParametricType == $scope.POWERMODEL) {
				valid = valid && $scope.sdpower_a !== '' && $scope.sdpower_b !== '';
			} else if ($scope.sdParametricType == $scope.PARABOLICMODEL) {
				valid = valid && $scope.sdparabolic_b1 !== '' && $scope.sdparabolic_b2 !== '' && $scope.sdparabolic_b3 !== '';
			} else {
				valid = false;
			}
			
			return valid;
		} else if ($scope.relationshipType == $scope.DISCRETE) {
			return $scope.discreteData != null;
		}
		return false;
	}
	
	$scope.addEdp = function() {
		if ($scope.newEdpValid()) {
			var edp;
			if ($scope.relationshipType == $scope.PARAMETRIC) {
				var meanModel = {
					type: $scope.meanParametricType
				};
				var sdModel = {
					type: $scope.sdParametricType
				};
				edp = {
					identifier: $scope.edpid,
					name: $scope.edpname,
					distributionFunction: {
						type: $scope.relationshipType,
						meanModel: meanModel,
						stddModel: sdModel
					},
					"minEDPValue":$scope.minEDPValue,
					"maxEDPValue":$scope.maxEDPValue
				};
				// Set the mean parameters
				if ($scope.meanParametricType == $scope.POWERMODEL) {
					meanModel.parameters = [$scope.meanpower_a, $scope.meanpower_b];
				} else if ($scope.meanParametricType == $scope.ASLANIMODEL) {
					meanModel.parameters = [$scope.meanaslani_a1, $scope.meanaslani_a2, $scope.meanaslani_a3];
				}
				// Set the dispersion parameters
				if ($scope.sdParametricType == $scope.POWERMODEL) {
					sdModel.parameters = [$scope.sdpower_a, $scope.sdpower_b];
				} else if ($scope.sdParametricType == $scope.PARABOLICMODEL) {
					sdModel.parameters = [$scope.sdparabolic_b1, $scope.sdparabolic_b2, $scope.sdparabolic_b3]
				}
			} else {
				// Store discrete data
				edp = {
					identifier: $scope.edpid,
					name: $scope.edpname,
					distributionFunction: {
						type: $scope.relationshipType,
						table: $scope.discreteData,
						rawData: false
					},
					"minEDPValue":$scope.minEDPValue,
					"maxEDPValue":$scope.maxEDPValue
				};
				if ($scope.discreteInputFormat == $scope.RAWDATAFORMAT) {
					edp.distributionFunction.table = $scope.extraPoints;
					edp.distributionFunction.rawData = true;
				}
			}
			inputService.addEdp(edp);
			
			// Clear data fields
			$scope.edpid = null;
			$scope.edpname = $scope.relationshipType = $scope.meanParametricType = $scope.sdParametricType = '';
			$scope.discreteData = null;
			$scope.meanpower_a = $scope.meanpower_b = $scope.meanaslani_a1 = $scope.meanaslani_a2 = $scope.meanaslani_a3 = $scope.sdpower_a = $scope.sdpower_b = $scope.sdparabolic_b1 = $scope.sdparabolic_b2 = $scope.sdparabolic_b3 = '';
		}
	}
	
	$scope.editEdp = function(edp) {
		$scope.edpid = edp.identifier;
		$scope.edpname = edp.name;
		$scope.minEDPValue = edp.minEDPValue;
		$scope.maxEDPValue = edp.maxEDPValue;
		
		if (edp.distributionFunction.type == $scope.DISCRETE) {
			// Deal with discrete data sets
			$scope.relationshipType = $scope.DISCRETE;
			if (edp.distributionFunction.rawData) {
				$scope.processDiscreteData(edp.distributionFunction.table);
			} else {
				$scope.discreteData = edp.distributionFunction.table;
			}
		} else if (edp.distributionFunction.type == $scope.PARAMETRIC) {
			$scope.relationshipType = $scope.PARAMETRIC;
			
			var meanModel = edp.distributionFunction.meanModel;
			var sdModel = edp.distributionFunction.stddModel;
			
			// Set the mean parameters
			$scope.meanParametricType = meanModel.type;
			if (meanModel.type == $scope.POWERMODEL) {
				$scope.meanpower_a = meanModel.parameters[0];
				$scope.meanpower_b = meanModel.parameters[1];
			} else if (meanModel.type == $scope.ASLANIMODEL) {
				$scope.meanaslani_a1 = meanModel.parameters[0];
				$scope.meanaslani_a2 = meanModel.parameters[1];
				$scope.meanaslani_a3 = meanModel.parameters[2];
			}
			
			// Set the dispersion parameters
			$scope.sdParametricType = sdModel.type;
			if (sdModel.type == $scope.POWERMODEL) {
				$scope.sdpower_a = sdModel.parameters[0];
				$scope.sdpower_b = sdModel.parameters[1];
			} else if (sdModel.type == $scope.PARABOLICMODEL) {
				$scope.sdparabolic_b1 = sdModel.parameters[0];
				$scope.sdparabolic_b2 = sdModel.parameters[1];
				$scope.sdparabolic_b3 = sdModel.parameters[2];
			}
		}
		
		$scope.deleteEdp(edp);
	};
	
	$scope.deleteEdp = function(edp) {
		inputService.deleteEdp(edp);
	};
	
	$scope.deleteEdpConfirm = function(edp) {
		if (confirm("Are you sure you want to delete \"" + edp.name + "\"?")) {
			$scope.deleteEdp(edp);
		}
	};
	
	$scope.processDiscreteData = function(points) {
		if ($scope.discreteInputFormat == $scope.MEANSDFORMAT) {
			$scope.discreteData = points;
			$scope.extraPoints = null;
		} else if ($scope.discreteInputFormat == $scope.RAWDATAFORMAT) {
			// We need to calculate the mean and lognormal SD for each array of points.
			$scope.extraPoints = points;
			var data = [];
			for (var i = 0; i < points.length; ++i) {
				var point = points[i];
				var x = point[0];
				var meanln = 0;
				var sdln = 0;
				var mean = 0;
				var N = point.length - 1;
				
				// Iterate over all the measurements for this point to find the mean.
				// Ignore zeroes.
				for (var j = 1; j < point.length; ++j) {
					if (point[j] == 0) {
						N--;
						continue;
					}
					meanln += Math.log(point[j]);
				}
				meanln /= N;
				
				// Iterate over all the measurements for this point to find the S.D.
				for (var j = 1; j < point.length; ++j) {
					if (point[j] == 0) {
						continue;
					}
					var a = Math.log(point[j]) - meanln;
					sdln += a*a;
				}
				sdln = Math.sqrt(sdln / (N - 1));
				
				// Calculate Mean[EDP|IM]
				mean = Math.exp(meanln + sdln * sdln / 2.0);
				data.push([x, mean, sdln]);
			}
			$scope.discreteData = data;
		}
	}
	
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
							$scope.processDiscreteData(results.points);
							
							// Now replace the file input with a new, identical one.
							var oldInput = document.getElementById('edpFileSelect'); 
							var newInput = document.createElement('input');
							newInput.type = 'file';
							newInput.id = oldInput.id;
							oldInput.parentNode.replaceChild(newInput, oldInput);
							// Listen for changes on the new node
							document.getElementById('edpFileSelect').addEventListener('change', $scope.handleFileSelect);
						} catch (err) {
							alert("Error: Invalid file format.");
						}
					});
				};
				r.readAsText(f);
			}
		});
	};
	
	document.getElementById('edpFileSelect').addEventListener('change', $scope.handleFileSelect);
}]);
