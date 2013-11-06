"use strict";

// Retrieve the app module so we can add controllers to it.
var MOD_app = angular.module('app');

// ResultsCtrl - Calculate/Results page
MOD_app.controller('ResultsCtrl', ['$scope', '$http', 'inputService', function($scope, $http, inputService) {
	$scope.im = inputService.getIm();
	$scope.edps = inputService.getEdps();
	
	// Enums for request state
	$scope.REQUEST_NOT_SENT = 0;
	$scope.REQUEST_PENDING = 1;
	$scope.REQUEST_COMPLETE = 2;
	
	$scope.inputJson = function() {
		return inputService.getConvertedJSONString();
	};
	$scope.outputJson = '';
	
	$scope.options = inputService.getCalculationOptions();
	
	// Results returned from the server
	$scope.results = {};
	
	$scope.availableEdpLines = [];
	$scope.edpHazardGraphData = {
		xAxisLabel: 'EDP value',
		yAxisLabel: 'Annual Rate of Exceedance',
		lines: []
	};
	
	$scope.calculationStatus = $scope.REQUEST_NOT_SENT;

	// Watch for EDP line array changes
	$scope.$watch('availableEdpLines', function(n, o) {
		$scope.updateEdpChart();
	});
	
	// Returns "" if demolition hazard is available to be calculated.
	// Otherwise, returns the reason why not, in parentheses.
	$scope.demoHazardAvailable = function() {
		// TODO (and in the other "available" methods):
		// Do a deep verify of the IM and other structures. Probably
		// requires a service.
		if (!$scope.im) {
			return "(Intensity measure undefined. Please complete the Seismic Hazard section.)"
		}
		return "";
	}
	
	// Returns "" if collapse hazard is available to be calculated.
	// Otherwise, returns the reason why not, in parentheses.
	$scope.collapseHazardAvailable = function() {
		if (!$scope.im) {
			return "(Intensity measure undefined. Please complete the Seismic Hazard section.)"
		}
		return "";
	}
	
	// Returns "" if EDP hazard is available to be calculated.
	// Otherwise, returns the reason why not, in parentheses.
	$scope.edpHazardAvailable = function() {
		if (!$scope.im) {
			return "(Intensity measure undefined. Please complete the Seismic Hazard section.)"
		} else if (!$scope.edps) {
			return "(No engineering demand parameters defined. Please complete the Seismic Response section.)"
		}
		return "";
	}
	
	$scope.updateEdpChart = function() {
		var lines = [];
		for (var i = 0; i < $scope.availableEdpLines.length; ++i) {
			var line = $scope.availableEdpLines[i];
			if (line.plot) {
				lines.push(line);
			}
		}
		$scope.edpHazardGraphData.lines = lines;
	};
	
	$scope.calculationValid = function() {
		// Check that some calculation was selected
		if (($scope.options.demolitionRateCalc
				|| $scope.options.collapseRateCalc
				|| $scope.options.edpRateCalc) == false) {
			return false;
		}
		
		// TODO: Make sure all of the required options are filled in
		return true;
	}
	
	$scope.calculate = function() {
		// Send request to server and start periodically polling for results.
		$scope.calculationStatus = $scope.REQUEST_PENDING;
		// TODO: Set calculation options
		inputService.sendRequest(function(result) {
			$scope.outputJson = JSON.stringify(result, null, 2);
			$scope.results = result;
			$scope.processResults(result);
			$scope.calculationStatus = $scope.REQUEST_COMPLETE;
		});
	}
	
	$scope.processResults = function(results) {
		// Build EDP hazard graph
		if (!!results.edprOutput.edpRates) {
			var lines = [];
			for (var i = 0; i < results.edprOutput.edpRates.length; ++i) {
				var edpres = results.edprOutput.edpRates[i];
				var points = [];
				for (var j = 0; j < edpres.x.length; ++j) {
					points.push([edpres.x[j],edpres.y[j]]);
				}
				var line = {
					"name": edpres.name,
					"data": points,
					"isDiscrete": true,
					"plot": i == 0
				};
				lines.push(line);
			}
			$scope.availableEdpLines = lines;
		}
		if (!!results.collapseOutput) {
			if (results.collapseOutput.rate > 0){
				$scope.results.collapseRate =  results.collapseOutput.rate.toExponential();
			} else {
					$scope.results.collapseRate = -99;
			}
		}
		if (!!results.demolitionOutput) {
			if (results.demolitionOutput.rate > 0){
				$scope.results.demolitionRate = results.demolitionOutput.rate.toExponential();
			} else {
				$scope.results.demolitionRate  = -99;
			}
		}
	}
}]);