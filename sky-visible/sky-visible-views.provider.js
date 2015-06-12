(function() {
	"use strict";

	angular.module('skyVisible').provider('skyVisibleViews', skyVisibleViews);

	skyVisibleViews.$inject = [];

	function skyVisibleViews() {
		var _this = this;

		// Default views
		_this.views = {
			'outer': outerView,
			'inner': innerView
		};

		_this.$get = function() {
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
		 * @param {object} dimentions - the element dimentions (height, width, top etc..)
		 * @param {object} scrollPosition - the current x and y
		 * @param {number} windowHeight
		 * @param {number} documentHeight
		 * @param {object} preferences - objects passed through, enabling reusing views
		 * @return {object} - with the progress (%) and distance (px)
		 */
		function outerView(element, dimentions, scrollPosition, windowHeight, documentHeight, preferences){

			// Bottom position
			var elementOffsetBottom = dimentions.height + dimentions.top;

			// The distance between start and stop
			var range = windowHeight + dimentions.height;

			// foldOffset makes sure, that even if an element is above the fold,
			// the progress starts at 0 - it basicly just shortens the range
			if(preferences.foldOffset) {
				range -= dimentions.top < windowHeight ? windowHeight - dimentions.top : 0;
			}

			// How far has it moved (px)
			var distance = Math.min(Math.max(range - (elementOffsetBottom - scrollPosition.y), 0), range);

			// The progress in percentage
			var progress = Math.min(Math.max(distance / range , 0), 1);

			// bottomOffset is a bit like foldOffset, it just makes
			// sure the progress reaces 1 when bottom of the page is reached
			if(preferences.bottomOffset) {
				var bottomOffset = documentHeight - dimentions.top;
				var multiplier = range/bottomOffset;

				if(bottomOffset < range) {
					progress *= multiplier;
				}
			}

			// Returns an object, with distance and progress,
			// which is passed to the callback function
			return {
				progress: progress,
				distance: distance
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
		 * @param {object} dimentions - the element dimentions (height, width, top etc..)
		 * @param {object} scrollPosition - the current x and y
		 * @param {number} windowHeight
		 * @param {number} documentHeight
		 * @param {object} preferences - objects passed through, enabling reusing views
		 * @return {object} - with the progress (%) and distance (px)
		 */
		function innerView(element, dimentions, scrollPosition, windowHeight, documentHeight, preferences) {

			// The distance between start and stop
			var	range = windowHeight - dimentions.height;

			// foldOffset makes sure, that even if an element is above the fold,
			// the progress starts at 0 - it basicly just shortens the range
			if(preferences.foldOffset) {
				range -= dimentions.top < windowHeight ? windowHeight - (dimentions.top + dimentions.height) : 0;
			}

			// How far has it moved (px)
			var distance = Math.min(Math.max(range - (dimentions.top - scrollPosition.y), 0), range);

			// The progress in percentage
			var progress = Math.min(Math.max(distance / range , 0), 1);

			// bottomOffset is a bit like foldOffset, it just makes
			// sure the progress reaces 1 when bottom of the page is reached
			if(preferences.bottomOffset) {
				var bottomOffset = documentHeight - (dimentions.top + dimentions.height);
				var multiplier = range/bottomOffset;

				if(bottomOffset < range) {
					progress *= multiplier;
				}
			}

			// Returns an object, with distance and progress,
			// which is passed to the callback function
			return {
				progress: progress,
				distance: distance
			};
		}
	}
})();
