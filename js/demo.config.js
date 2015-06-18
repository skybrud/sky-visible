(function() {
	"use strict";

	angular.module('demo').config(demoConfig);

	demoConfig.$inject = ['skyVisibleProvider', 'skyVisibleViewsProvider'];

	function demoConfig(skyVisibleProvider, skyVisibleViewsProvider) {
		skyVisibleViewsProvider.views['sticky'] = function(element, dimensions, scroll) {
			var offsetTop = scroll.y > dimensions.top ? scroll.y - dimensions.top : 0;

			return offsetTop;
		};
	}
})();
