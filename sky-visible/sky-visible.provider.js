(function() {
	"use strict";

	angular.module('skyVisible').provider('skyVisible', skyVisibleProvider);

	skyVisibleProvider.$inject = [];

	function skyVisibleProvider() {
		var _this = this;

		_this.defaults = {
			// Take the offset above fold into account
			foldOffset: true,
			// Makes sure progress reaches 1 when
			// bottom of page is reached
			bottomOffset: true,
			// Caches the value - prevents executing callback
			// if value is the same
			cache:true
		};

		_this.getDefaults = function() {
			return _this.defaults;
		};

		_this.$get = skyVisible;

		skyVisible.$inject = ['skyVisibleViews', '$window'];

		function skyVisible(skyVisibleViews, $window) {

			// window variables
			var scrollPosition = {
				x:$window.pageYOffset,
				y:$window.pageXOffset
			};

			var windowHeight = $window.innerHeight;

			// Get the document height - assume it's the highest number
			var documentHeight = Math.max(document.body.scrollHeight, document.body.offsetHeight, document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight);

			// List of all elements and their preferences
			var items = [];

			// Different calculations
			var views = skyVisibleViews;

			// Default view preferences
			var defaults = _this.getDefaults();

			/**
			 * Runs on resize debounce.
			 * Iterates through onResizeMethods
			 *
			 * Makes sure the resize methods are run after the window and
			 * document height is calculated
			 */
			function recalculateItems(element) {
				element = element ? getElement(element) : false;

				// Get the window height
				windowHeight = $window.innerHeight;
				documentHeight = Math.max(document.body.scrollHeight, document.body.offsetHeight, document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight);

				if(element) {
					recalculateItem(getItem(element));
					return;
				}

				for (var i = 0; i < items.length; i++) {
					recalculateItem(items[i]);
				}

				function recalculateItem(item) {
					if(!item) {
						return;
					}
					// If theres a shouldRecalculate method, make sure it returns true
					if((angular.isFunction(item.shouldRecalculate) && item.shouldRecalculate()) || item.shouldRecalculate === undefined || item.shouldRecalculate ) {
						item.recalculate();
					}
				}
			}

			/**
			 * Runs through all methods in onScrollMethods
			 *
			 * Makes sure the methods are only run after the scroll
			 * position and window position is calculated
			 *
			 * @param {node} element [optional]
			 * @param {boolean} checkCache [optional]
			 */
			function checkItemsViews(element, checkCache) {
				element = element ? getElement(element) : false;

				// Get scroll position
				var position = {
					y: $window.pageYOffset,
					x: $window.pageXOffset
				};

				// Prevent running methods if position not changed
				if(angular.equals(position, scrollPosition) && checkCache) {
					return;
				} else {
					angular.extend(scrollPosition, position);
				}

				if(element) {
					checkItemViews(getItem(element));
					return;
				}

				for (var i = 0; i < items.length; i++) {
					checkItemViews(items[i]);
				}

				function checkItemViews(item) {
					// If theres a shouldUpdate method, make sure it returns true
					if((angular.isFunction(item.shouldUpdate) && item.shouldUpdate()) || item.shouldUpdate === undefined || item.shouldUpdate) {
						item.checkViews();
					}
				}
			}

			/**
			 * Public method that adds methods to a view, for
			 * a given element
			 *
			 * @param {array} elements
			 * @param {string} view
			 * @param {object} preferences [optional]
			 * @param {function} method
			 */
			function addMethods(elements, view, preferences, method) {
				elements = elements.length !== undefined ? elements : [elements];

				// View is left out
				if(angular.isObject(view)) {
					method = preferences;
					preferences = view;
					view = '';

				// view and preferences are left out
				} else if(angular.isFunction(view)) {
					method = view;
					preferences = {};
					view = '';

				// Preferences is left out
				} else if(angular.isFunction(preferences)) {
					method = preferences;
					preferences = {};
				}

				for (var i = 0; i < elements.length; i++) {
					var element = getElement(elements[i]);

					var item = addMethod(element, view, preferences, method, name);

					// If first - init item
					if(item.methods.length === 1 && angular.equals(item.methods[0].method, method)) {
						itemSetup(element);
					}
				}
			}

			/**
			 * Public method that removes a method from a
			 * bunch of element
			 * @param {array} elements
			 * @param {string} view
			 * @param {function} method
			 */
			function removeMethods(elements, view, method) {
				elements = elements.length !== undefined ? elements : [elements];

				// View is left out
				if(angular.isFunction(view)) {
					method = view;
					view = '';
				}

				// If no method or view, remove entire item
				if(!method && !view) {
					removeItems(elements);
					return;
				}

				for (var i = 0; i < elements.length; i++) {
					var element = getElement(elements[i]);
					var item = getItem(element);

					item.methods = item.methods.filter(filterMethods);
				}

				// Filter out methods based on view & method
				function filterMethods(item) {
					if(!method && view) {
						return item.view !== view;
					} else if(method && !view) {
						return item.method !== method;
					}

					return !(item.method === method && item.view === view);
				}
			}

			/**
			 * Get an item based on element
			 *
			 * @param {node} element
			 * @return {object}
			 */
			function getItem(element) {
				// If angular element or normal element
				element = element.tagName ? element : element[0];
				var index = getItemIndex(element);
				return items[index];
			}

			/**
			 * Create an item with a givin element,
			 * if non found, and returns the item
			 *
			 * @param {node} element
			 * @return {object}
			 */
			function addItem(element) {
				element = getElement(element);

				var index = getItemIndex(element);

				// Add to items and store item
				if(index === -1) {
					index = -1 + items.push({
						node: element,
						methods: []
					});
				}

				return items[index];
			}

			/**
			 * Removes items, based on their element
			 *
			 * @param {array} elements
			 */
			function removeItems(elements) {
				elements = elements.length !== undefined ? elements : [elements];

				for (var i = 0; i < elements.length; i++) {
					var index = getItemIndex(elements[i]);
					if(index !== -1) {
						items.splice(index, 1);
					}
				}
			}

			/**
			 * This methods does all the calculations and exposes
			 * methods for recalculation and checking views
			 *
			 * @param {node} element
			 */
			function itemSetup(element) {
				element = element instanceof Element ? element : angular.element(element);

				// Element properties
				var boundingRect = element.getBoundingClientRect();

				var dimentions = {
					height: element.offsetHeight,
					width: element.offsetWidth,
					top: boundingRect.top + scrollPosition.y - document.documentElement.clientTop,
					left: boundingRect.left + scrollPosition.x - document.documentElement.clientLeft,
					boundingClientRect: boundingRect
				};

				var elementHeight = element.offsetHeight;
				var elementBoundingRect = element.getBoundingClientRect();
				var elementOffsetTop = elementBoundingRect.top + scrollPosition.y - document.documentElement.clientTop;

				var viewVariables = {};

				var item = getItem(element);

				item.recalculate = recalculate;
				item.checkViews = checkViews;
				item.dimentions = dimentions;

				angular.element(element).on('$destroy skyVisible:unbind', destroy);

				// Assume other elements affected
				checkItemsViews();

				/**
				 * Recalculates variables
				 * Function added to onResize
				 */
				function recalculate() {
					boundingRect = element.getBoundingClientRect();

					dimentions.height = element.offsetHeight;
					dimentions.width = element.offsetWidth;
					dimentions.top = boundingRect.top + scrollPosition.y - document.documentElement.clientTop;
					dimentions.left = boundingRect.left + scrollPosition.x - document.documentElement.clientLeft;
					dimentions.boundingClientRect = boundingRect;

					checkViews();
				}

				/**
				 * Checks rather the element is visible in the defined
				 * views. It will then loop over them and dispatch an event
				 * with the given values
				 */
				function checkViews()  {
					var element = item.node;
					var methods = item.methods;

					for(var j = 0; j < methods.length; j++) {
						var method = methods[j];
						var callback = method.method;
						var view = method.view;
						var preferences = method.preferences;
						var value;


						if(views[view] && angular.isFunction(callback)) {
							// Continue if shouldUpdate function returns fales
							if(angular.isFunction(preferences.shouldUpdate) && !preferences.shouldUpdate()) {
								continue;
							}

							// Continue if shouldUpdate is falsy, without being undefined
							if(preferences.shouldUpdate !== undefined && !preferences.shouldUpdate) {
								continue;
							}

							// Get value
							value = views[view].call(undefined, element, dimentions, scrollPosition, windowHeight, documentHeight, preferences);

							// Continue if nothing changed
							if(angular.equals(value, method.value) && preferences.cache) {
								continue;
							}

							callback.call(element, value, dimentions);
							method.value = value;
						}
					}
				}

				/**
				 * Unbind and remove resize/scroll methods
				 */
				function destroy() {
					removeItems(element);
					angular.element(element).off('$destroy skyVisible:unbind', destroy);
				}
			}

			/**
			 * Get the index of an item, that
			 * has a giving element
			 *
			 * @param {node} element
			 * @return {number}
			 */
			function getItemIndex(element) {
				var index = -1;
				for (var i = 0; i < items.length; i++) {
					var item = items[i];

					if(element instanceof Element && item.node === element) {
						index = i;
						break;
					}

					if(angular.isString(element) && element === item.name) {
						index = i;
						break;
					}
				}

				return index;
			}

			/**
			 * Get an element from the items list
			 *
			 * @param {node} element
			 * @return {node}
			 */
			function getElement(element) {
				// String -> getItem -> node
				// Element -> element
				// defined -> element[0]
				// element
				return angular.isString(element) ? getItem(element).node : element instanceof Element ? element : element !== undefined ? element[0] : element;
			}

			/**
			 * Adds a method to an item. The element is used to finde
			 * the specific item - if non found it will create one
			 *
			 * The used item will be returned
			 *
			 * @param {node} element
			 * @param {string} view [outer]
			 * @param {object} preferences
			 * @param {function} method
			 * @return {object}
			 */
			function addMethod(element, view, preferences, method) {
				view = view || 'outer';

				preferences =  angular.extend({}, defaults, (preferences || {}));

				// If element already added
				var index = getItemIndex(element);

				var exists = index !== -1;

				// The element item
				var item = addItem(element);

				// Add a view if givin
				// Adds to array of views
				if(item.methods.length) {
					item.methods.push({
						view:view,
						method:method,
						preferences:preferences
					});
					// Creates an array of views
				} else {
					item.methods = [{
						view:view,
						method:method,
						preferences:preferences
					}];
				}

				return item;
			}

			/**
			 * Give an item a reference name. The element
			 * is used to find an item
			 *
			 * @param {node} element
			 * @param {string} name
			 * @return {object}
			 */
			function setReference(element, name) {
				var item = addItem(element);
				item.name = name;
				return item;
			}

			/**
			 * Look up an item by reference name
			 *
			 * @param {string} name
			 * @return {object|boolean}
			 */
			function getReference(name) {
				var item = getItem(name) || {};
				return item.node || false;
			}

			// Exposes public methods
			return {
				setReference:setReference,
				getReference:getItem,

				bind:addMethods,
				unbind:removeMethods,

				recalculate:recalculateItems,
				checkViews:checkItemsViews
			};
		}
	}
})();
