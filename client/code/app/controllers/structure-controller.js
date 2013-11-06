"use strict";

// Retrieve the app module so we can add controllers to it.
var MOD_app = angular.module('app');

// StructureCtrl - Structure page
MOD_app.controller('StructureCtrl', ['$scope', '$http', 'inputService',
																			function($scope, $http, inputService) {
	var newFF = {
		'identifier': 0,
		'name': "Create new..."
	};
	
	$http.get('/getff').
	success(function(data) {
		var libraryFFs = data.fragilityfunctions;
		var customFFs = inputService.getCustomFfs();
		$scope.ff = [newFF].concat(libraryFFs, customFFs);
	});

	$scope.edps = inputService.getEdps();
	$scope.pgroups = inputService.getPGroups();
	
	$scope.damagestates = [];
	
	$scope.ffFormValid = function() {
		return !!$scope.customFfName;
	};
	
	$scope.pgroupFormValid = function() {
		return !!$scope.pgroupName && $scope.pgroupQuantity > 0 && !!$scope.pgroupFF && $scope.pgroupEDP != null;
	};
	
	$scope.getFFName = function(id) {
		if (!$scope.ff) { return "Loading..." };
		for (var i = 0; i < $scope.ff.length; ++i) {
			if ($scope.ff[i].identifier == id) {
				return $scope.ff[i].name;
			}
		}
		return 'ERROR: Non-existent component type';
	};
	
	$scope.getEdpName = function(id) {
		var edp = inputService.getEdp(id);
		if (edp) {
			return edp.name;
		} else {
			return 'ERROR: Non-existent EDP';
		}
	};

	$scope.addPGroup = function() {
		// Add a new performance group.
		inputService.addPGroup($scope.pgroupName, $scope.pgroupQuantity, $scope.pgroupFF, $scope.pgroupEDP);
		$scope.pgroupName = $scope.pgroupQuantity = $scope.pgroupFF = $scope.pgroupEDP = null;
	};
	
	$scope.editPGroup = function(pgroup) {
		$scope.pgroupName = pgroup.name;
		$scope.pgroupQuantity = pgroup.quantity;
		$scope.pgroupFF = pgroup.ff;
		$scope.pgroupEDP = pgroup.edp;
		$scope.deletePGroup(pgroup);
	};
	
	$scope.deletePGroup = function(pgroup) {
		inputService.deletePGroup(pgroup);
	};
	
	$scope.deletePGroupConfirm = function(pgroup) {
		if (confirm("Are you sure you want to delete \"" + pgroup.name + "\"?")) {
			$scope.deletePGroup(pgroup);
		}
	};
}]);
