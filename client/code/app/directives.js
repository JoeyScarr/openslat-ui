/*global angular */
// client/code/app/directives
/* AngularJS directives */
angular.module('app.directives', [])
	.directive('buttonsRadio', function() {
	return {
		restrict: 'E',
		scope: { model: '=', values:'&', labels:'&' },
		controller: function($scope){
			$scope.activate = function(option){
				$scope.model = option;
			};      
		},
		template: "<button type='button' class='btn' " +
								"ng-repeat='value in values()' " +
								"ng-class='{active: value == model}'" +
								"ng-click='activate(value)'>{{labels()[$index]}} " +
							"</button>"
	};
});
	