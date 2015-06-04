(function() {
	"use strict";

	angular.module('skyVisible').directive('skyVisible', skyVisibleDirective);

	skyVisibleDirective.$inject = ['skyVisible'];

	function skyVisibleDirective(skyVisible) {

		function link(scope, element, attrs) {
			scope.$watch(attrs.skyVisiblePreferences, function(preferences) {
				preferences = preferences || {};

				skyVisible.bind(element, preferences);
			});
		}

		return link;
	}
})();
