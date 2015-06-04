(function() {
	"use strict";

	angular.module('skyVisible', []);

	angular.module('skyVisible').run(run);

	run.$inject = ['skyVisible', '$window'];

	// Configure when to recalculate
	function run(skyVisible, $window) {

		// Window resize event debounce
		var resizeDebounce;

		// Bind events to window
		angular.element($window).on('scroll', function() {
			skyVisible.checkViews(false, true);
		});

		// Recalculate with a 300ms debounce
		angular.element($window).on('resize', function() {
			clearTimeout(resizeDebounce);
			resizeDebounce = setTimeout(function() {
				skyVisible.recalculate();
				skyVisible.checkViews();
			}, 300);
		});

	}

})();

