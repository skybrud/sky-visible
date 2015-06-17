(function() {
	"use strict";

	angular.module('demo').directive('sticky', stickyDirective);

	stickyDirective.$inject = ['skyVisible'];

	function stickyDirective(skyVisible) {
		return {
			link:link
		};

		function link(scope, element, attrs) {
		}
	}
})();
