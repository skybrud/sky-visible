declare module sky {
	interface ISkyVisibleProvider {
		defaults:{any:any};
		getDefaults:()=>any[];
		$get:ISkyVisible;
	}

	interface ISkyVisible {
		setReference:(element:Element, name:string) => Element;
		getReference:(name:string) => Element;
		bind:(element:any, view:any, preferences:any, method:any)=>void;
		unbind:(element:any)=>void;
		recalculate:(element?:Element)=>void;
		checkViews:(element?:Element, checkCache?:boolean)=>void;
	}

	interface ISkyVisibleItem {
		node:Element;
		methods:ISkyVisbileItemMethods;
		name?:string;
	}

	interface ISkyVisbileItemMethods {
		[index: number]: ISkyVisbileItemMethod;
	}

	interface ISkyVisbileItemMethod {
		(value:any, dimensions:ISkyVisibleItemDimensions):void;
	}

	interface ISkyVisibleItemDimensions {
		top:number;
		left:number;
		width:number;
		height:number;
	}
}

(function() {
	"use strict";

	angular.module('skyVisible').provider('skyVisible', skyVisibleProvider);

	skyVisibleProvider.$inject = [];

	function skyVisibleProvider():sky.ISkyVisibleProvider {
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

		function skyVisible(skyVisibleViews, $window):sky.ISkyVisible {

			// window variables
			var scrollPosition = {
				x:$window.pageXOffset,
				y:$window.pageYOffset,
				deltaY:0,
				deltaX:0
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

					angular.forEach(item.methods, function(method) {
						// Clear all save method valyes
						// if `flush` preference true
						if(method.preferences && method.preferences.flush) {
							delete method.value;
						}

						// If recalculate method specified - fire it
						if(method.preferences && angular.isFunction(method.preferences.recalculate)) {
							method.preferences.recalculate.apply(item.node);
							checkItemsViews(item.node);
						}
					});

					// If theres a shouldRecalculate method, make sure it returns true
					if((angular.isFunction(item.shouldRecalculate) && item.shouldRecalculate()) || item.shouldRecalculate === undefined || item.shouldRecalculate ) {
						if(typeof item.recalculate === 'function') {
							item.recalculate();
						}
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
			function checkItemsViews(element?:Element, checkCache?:boolean) {
				element = element ? getElement(element) : false;


				// Get scroll position
				var position = {
					y: $window.pageYOffset,
					x: $window.pageXOffset
				};

				// Prevent running methods if position not changed
				if(position.y === scrollPosition.y && position.x === scrollPosition.x && checkCache) {
					return;
				} else {
					scrollPosition.deltaY = position.y - scrollPosition.y;
					scrollPosition.deltaX = position.x - scrollPosition.x;
					scrollPosition.y = position.y;
					scrollPosition.x = position.x;
				}

				// Dont check views if scroll beyond screen
				if(scrollPosition.y < 0 || scrollPosition.x < 0) {
					return;
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
						if(typeof item.checkViews === 'function') {
							item.checkViews(true);
						}
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
			function addMethods(elements:any, view?:any, preferences?:any, method?:any):void {
				elements = angular.isArray(elements) ? elements : [elements];

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

					addMethod(element, view, preferences, method);
				}

				// Assume other elements affected
				checkItemsViews();
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
				// The element item
				var item = addItem(element);

				view = view || 'outer';
				preferences = angular.extend({}, defaults, (preferences || {}));

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
						preferences:preferences,

					}];
				}

				return item;
			}

			/**
			 * Public method that removes a method from a
			 * bunch of element
			 * @param {array} elements
			 * @param {string} view
			 * @param {function} method
			 */
			function removeMethods(elements:any, view?:any, method?:any):void {
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
			function getItem(element:any) {
				// If angular element or normal element
				element = getElement(element);
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
			function addItem(element, name?:string) {
				element = getElement(element);

				var index = getItemIndex(element);

				// Add to items and store item
				if(index === -1) {
					index = -1 + items.push({
						methods: [],
					});


					// Added as reference
					if(angular.isString(element)) {
						items[index].name = element;

					// Added as element
					} else {
						items[index].node = element;
						itemSetup(element);
					}

				// Added as references before element
				} else if(!items[index].node && element instanceof Element) {
					items[index].node = element;
					itemSetup(element);
				}

				if(name) {
					items[index].name = name;
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

				var dimensions = {
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
				item.dimensions = dimensions;

				angular.element(element).on('$destroy skyVisible:unbind', destroy);

				/**
				 * Recalculates variables
				 * Function added to onResize
				 */
				function recalculate() {
					boundingRect = element.getBoundingClientRect();

					dimensions.height = boundingRect.height ? boundingRect.height : element.offsetHeight;
					dimensions.width = boundingRect.width ? boundingRect.width : element.offsetWidth;
					dimensions.top = boundingRect.top + scrollPosition.y - document.documentElement.clientTop;
					dimensions.left = boundingRect.left + scrollPosition.x - document.documentElement.clientLeft;
					dimensions.boundingClientRect = boundingRect;

					checkViews();
				}

				/**
				 * Checks rather the element is visible in the defined
				 * views. It will then loop over them and dispatch an event
				 * with the given values
				 *
				 * @param {boolean} flush - skip cache
				 */
				function checkViews(flush?:boolean)  {
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
							value = views[view].call(undefined, element, dimensions, scrollPosition, windowHeight, documentHeight, preferences);

							// Continue if nothing changed
							if((angular.equals(value, method.value) && preferences.cache) || !flush) {
								continue;
							}
							callback.call(element, value, dimensions, scrollPosition);
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
			 * @param {node|string} element
			 * @return {number}
			 */
			function getItemIndex(element:Element|string):number {
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
			 * @param {DOMElement|string} element - the element or string
			 * @return {DOMElement|boolean} - if nothing found false is returned
			 */
			function getElement(element:Element|string) {
				if(element instanceof Element) {
					return element;
				}

				if(angular.isElement(element)) {
					return element[0];
				}

				if(angular.isArray(element)) {
					return element[0];
				}

				return element;
			}

			/**
			 * Give an item a reference name. The element
			 * is used to find an item
			 *
			 * @param {node} element
			 * @param {string} name
			 * @return {object}
			 */
			function setReference(element:Element, name:string) {
				var reference = getItem(name);

				var item = addItem(element, name);

				// Merge reference methods
				if(reference) {
					item.methods = item.methods.concat(reference.methods);
					delete items.splice(getItemIndex(name), 1);
				}

				return item;
			}

			/**
			 * Look up an item by reference name
			 *
			 * @param {string} name
			 * @return {object|boolean}
			 */
			function getReference(name:string) {
				var item = getItem(name) || {};
				return item.node || false;
			}

			/**
			 * Return the dimensions object based
			 * on the an element or reference name
			 *
			 * @param {node|string}
			 * @return {object}
			 */
			function getDimensions(element:Element|string):sky.ISkyVisibleItemDimensions {
				var item = getItem(element);

				return item.dimensions || {};
			}

			// Exposes public methods
			return {
				setReference:setReference,
				getReference:getItem,

				bind:addMethods,
				unbind:removeMethods,

				recalculate:recalculateItems,
				checkViews:checkItemsViews,

				getDimensions:getDimensions
			};
		}

		return this;
	}
})();
