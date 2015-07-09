(function() {
	"use strict";

	angular.module('skyVisible').directive('skyVisible', skyVisibleDirective);

	skyVisibleDirective.$inject = ['skyVisible'];

	function skyVisibleDirective(skyVisible) {

		function link(scope, element, attrs) {
			var preferenceBinding = scope.$watch(attrs.skyVisiblePreferences, function(preferences) {
				preferences = preferences || {};

				skyVisible.bind(element, preferences);
				preferenceBinding();
			});

			var nameBinding = attrs.$observe('skyVisibleName', function(name) {
				if(name) {
					skyVisible.setReference(element[0], name);
					nameBinding();
				}
			});

		}

		return link;
	}
})();
