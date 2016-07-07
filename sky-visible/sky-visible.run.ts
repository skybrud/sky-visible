(function() {
	"use strict";

	angular.module('skyVisible').run(run);

	run.$inject = ['$rootScope', 'skyVisible', '$window', 'isIOS'];

	// Configure when to recalculate
	function run($rootScope, skyVisible, $window, isIOS) {

		// Bind events to window
		var _window: any = window;

		var supportsPassive = false;
		try {
			var opts = Object.defineProperty({}, 'passive', {
				get: function() {
					supportsPassive = true;
				}
			});
		} catch (e) {}

		// Bind events to window
		_window.addEventListener('scroll', function() {
			skyVisible.checkViews(false, true);
		}, supportsPassive ? { passive: true } : false);

		_window.addEventListener('orientationchange', function() {
			// Recalculate with a 300ms debounce
			skyVisible.refresh(300);
		});

		_window.addEventListener('resize', function() {
			if(isIOS) {
				skyVisible.refresh(0);
				return;
			}

			// Recalculate with a 300ms debounce
			skyVisible.refresh(300);
		}, supportsPassive ? { passive: true } : false);


		// Recalculate on window load
		angular.element(_window).on('load', function() {
			skyVisible.refresh(0);
		});

		// Recalculate on document ready
		angular.element(document).ready(function() {
			skyVisible.refresh();
			// skyVisible.refresh(2000);
		});

		// Recalculate on viewEnter animation done (view.animation.ts)
		$rootScope.$on('viewAnimationDone', function() {
			skyVisible.refresh();
		});

	}

})();

