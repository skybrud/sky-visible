declare module sky {
	interface ISkyVisibleViewsProvider {
		views:ISkyVisibleViews;
		$get():ISkyVisibleViews;
	}
	
	interface ISkyVisibleViews {
		any:(values: any, dimensions:any) => any;
	}
}

(function() {
	"use strict";

	angular.module('skyVisible').provider('skyVisibleViews', skyVisibleViewsProvider);

	skyVisibleViewsProvider.$inject = [];

	function skyVisibleViewsProvider():sky.ISkyVisibleViewsProvider {
		var _this = this;

		// Default views
		_this.views = {
			'outer': outerView,
			'inner': innerView
		};

		this.$get = function():sky.ISkyVisibleViews {
			return _this.views;
		};

		/**
		 * Starts: element top >= scrollPositionBbottom
		 * Ends: element bottom <= scrollPosition
		 *
		 * values:
		 *		progress 0-1
		 *		distance px
		 *
		 * @param {node} element
		 * @param {object} dimensions - the element dimensions (height, width, top etc..)
		 * @param {object} scrollPosition - the current x and y
		 * @param {number} windowHeight
		 * @param {number} documentHeight
		 * @param {object} preferences - objects passed through, enabling reusing views
		 * @return {object} - with the progress (%) and distance (px)
		 */
		function outerView(element, dimensions, scrollPosition, windowHeight, documentHeight, preferences){

			// Bottom position
			var elementOffsetBottom = dimensions.height + dimensions.top;

			// The distance between start and stop
			var range = windowHeight + dimensions.height;

			// foldOffset makes sure, that even if an element is above the fold,
			// the progress starts at 0 - it basicly just shortens the range
			if(preferences.foldOffset) {
				range -= dimensions.top < windowHeight ? windowHeight - dimensions.top : 0;
			}

			// distance traveled (px)
			var distance = range - (elementOffsetBottom - scrollPosition.y);

			// The progress in percentage
			var progress = distance / range;

			// bottomOffset is a bit like foldOffset, it just makes
			// sure the progress reaces 1 when bottom of the page is reached
			if(preferences.bottomOffset) {
				var bottomOffset = documentHeight - dimensions.top;
				var multiplier = range/bottomOffset;

				if(bottomOffset < range) {
					progress *= multiplier;
				}
			}

			// Returns an object, with distance and progress,
			// which is passed to the callback function
			return {
				progress: progress,
				distance: dimensions.height * progress
			};
		}

		/**
		 * Starts: element bottom >= scrollPositionBottom
		 * Ends: element top <= scrollPosition
		 *
		 * values:
		 *		progress 0-1
		 *		distance px
		 *
		 * @param {node} element
		 * @param {object} dimensions - the element dimensions (height, width, top etc..)
		 * @param {object} scrollPosition - the current x and y
		 * @param {number} windowHeight
		 * @param {number} documentHeight
		 * @param {object} preferences - objects passed through, enabling reusing views
		 * @return {object} - with the progress (%) and distance (px)
		 */
		function innerView(element, dimensions, scrollPosition, windowHeight, documentHeight, preferences) {

			// The distance between start and stop
			var	range = dimensions.height < windowHeight ? windowHeight - dimensions.height : dimensions.height;

			// foldOffset makes sure, that even if an element is above the fold,
			// the progress starts at 0 - it basicly just shortens the range
			if(preferences.foldOffset) {
				range -= dimensions.top < windowHeight ? windowHeight - (dimensions.top + dimensions.height) : 0;
			}

			// distance travled
			var distance = range - (dimensions.top - scrollPosition.y);

			// The progress in percentage
			var progress = distance / range;

			// bottomOffset is a bit like foldOffset, it just makes
			// sure the progress reaces 1 when bottom of the page is reached
			if(preferences.bottomOffset) {
				var bottomOffset = documentHeight - (dimensions.top + dimensions.height);
				var multiplier = range/bottomOffset;

				if(bottomOffset < range) {
					progress *= multiplier;
				}
			}

			// Returns an object, with distance and progress,
			// which is passed to the callback function
			return {
				progress: progress,
				distance: range * progress
			};
		}

		return this;
	}
})();
