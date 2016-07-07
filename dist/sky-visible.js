(function () {
    "use strict";
    angular.module('skyVisible', []);
})();
(function () {
    "use strict";
    angular.module('skyVisible').directive('skyVisible', skyVisibleDirective);
    skyVisibleDirective.$inject = ['skyVisible'];
    function skyVisibleDirective(skyVisible) {
        function link(scope, element, attrs) {
            var preferenceBinding = scope.$watch(attrs.skyVisiblePreferences, function (preferences) {
                preferences = preferences || {};
                skyVisible.bind(element, preferences);
                preferenceBinding();
            });
            var nameBinding = attrs.$observe('skyVisibleName', function (name) {
                if (name) {
                    skyVisible.setReference(element[0], name);
                    nameBinding();
                }
            });
        }
        return link;
    }
})();
(function () {
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
            cache: true,
            // Cap progress between 0 and 1
            cap: true,
        };
        _this.getDefaults = function () {
            return _this.defaults;
        };
        _this.$get = skyVisible;
        skyVisible.$inject = ['skyVisibleViews', '$window', 'isIOS'];
        function skyVisible(skyVisibleViews, $window, isIOS) {
            // window variables
            var scrollPosition = {
                x: $window.pageXOffset,
                y: $window.pageYOffset,
                deltaY: 0,
                deltaX: 0
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
            // Debounce variable for refresh timeout
            var refreshDebounce;
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
                if (isIOS) {
                    windowHeight += 50;
                }
                if (element) {
                    recalculateItem(getItem(element));
                    return;
                }
                for (var i = 0; i < items.length; i++) {
                    recalculateItem(items[i]);
                }
                function recalculateItem(item) {
                    if (!item) {
                        return;
                    }
                    angular.forEach(item.methods, function (method) {
                        // Clear all save method valyes
                        // if `flush` preference true
                        if (method.preferences && method.preferences.flush) {
                            delete method.value;
                        }
                        // If recalculate method specified - fire it
                        if (method.preferences && angular.isFunction(method.preferences.recalculate)) {
                            method.preferences.recalculate.apply(item.node);
                            checkItemsViews(item.node);
                        }
                    });
                    // If theres a shouldRecalculate method, make sure it returns true
                    if ((angular.isFunction(item.shouldRecalculate) && item.shouldRecalculate()) || item.shouldRecalculate === undefined || item.shouldRecalculate) {
                        if (typeof item.recalculate === 'function') {
                            item.recalculate();
                        }
                    }
                }
            }
            /**
             * Convenience method for calling both recalculateItems and
             * checkItemViews
             *
             * Has an optional debounce.
             *
             * @param {number|boolean} debounce [optional]
             */
            function recalculateAndCheckItems(debounce) {
                if (debounce === void 0) { debounce = false; }
                if (debounce === false) {
                    // If no debounce, refresh immediately
                    recalculateAndCheckItemsMethod();
                }
                else {
                    // Debounce
                    clearTimeout(refreshDebounce);
                    refreshDebounce = setTimeout(recalculateAndCheckItemsMethod, debounce);
                }
                function recalculateAndCheckItemsMethod() {
                    recalculateItems(false);
                    checkItemsViews(null, false);
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
                if (checkCache === void 0) { checkCache = true; }
                element = element ? getElement(element) : false;
                // Get scroll position
                var position = {
                    y: $window.pageYOffset,
                    x: 0 //$window.pageXOffset
                };
                // Prevent running methods if position not changed
                if (position.y === scrollPosition.y && position.x === scrollPosition.x && checkCache) {
                    return;
                }
                else {
                    if (scrollPosition.y !== position.y) {
                        scrollPosition.deltaY = position.y - scrollPosition.y;
                    }
                    if (scrollPosition.x !== position.x) {
                        scrollPosition.deltaX = position.x - scrollPosition.x;
                    }
                    scrollPosition.y = position.y;
                    scrollPosition.x = position.x;
                }
                // Dont check views if scroll beyond screen
                if (scrollPosition.y < 0 || scrollPosition.x < 0) {
                    return;
                }
                if (element) {
                    window.requestAnimationFrame(function () {
                        checkItemViews(getItem(element));
                    });
                    return;
                }
                window.requestAnimationFrame(function () {
                    for (var i = 0; i < items.length; i++) {
                        checkItemViews(items[i]);
                    }
                });
                function checkItemViews(item) {
                    if (typeof item.checkViews === 'function') {
                        item.checkViews(true);
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
                elements = angular.isArray(elements) ? elements : [elements];
                // View is left out
                if (angular.isObject(view)) {
                    method = preferences;
                    preferences = view;
                    view = '';
                }
                else if (angular.isFunction(view)) {
                    method = view;
                    preferences = {};
                    view = '';
                }
                else if (angular.isFunction(preferences)) {
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
                if (item.methods.length) {
                    item.methods.push({
                        view: view,
                        method: method,
                        preferences: preferences
                    });
                }
                else {
                    item.methods = [{
                            view: view,
                            method: method,
                            preferences: preferences,
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
            function removeMethods(elements, view, method) {
                elements = elements.length !== undefined ? elements : [elements];
                // View is left out
                if (angular.isFunction(view)) {
                    method = view;
                    view = '';
                }
                // If no method or view, remove entire item
                if (!method && !view) {
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
                    if (!method && view) {
                        return item.view !== view;
                    }
                    else if (method && !view) {
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
            function addItem(element, name) {
                element = getElement(element);
                var index = getItemIndex(element);
                // Add to items and store item
                if (index === -1) {
                    index = -1 + items.push({
                        methods: [],
                    });
                    // Added as reference
                    if (angular.isString(element)) {
                        items[index].name = element;
                    }
                    else {
                        items[index].node = element;
                        itemSetup(element);
                    }
                }
                else if (!items[index].node && element instanceof Element) {
                    items[index].node = element;
                    itemSetup(element);
                }
                if (name) {
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
                    if (index !== -1) {
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
                function checkViews(flush) {
                    var element = item.node;
                    var methods = item.methods;
                    for (var j = 0; j < methods.length; j++) {
                        var method = methods[j];
                        var callback = method.method;
                        var view = method.view;
                        var preferences = method.preferences;
                        var value;
                        if (views[view] && angular.isFunction(callback)) {
                            // Continue if shouldUpdate function returns fales
                            if (angular.isFunction(preferences.shouldUpdate) && !preferences.shouldUpdate.call(element, dimensions, scrollPosition)) {
                                continue;
                            }
                            // Continue if shouldUpdate is falsy, without being undefined
                            if (preferences.shouldUpdate !== undefined && !preferences.shouldUpdate) {
                                continue;
                            }
                            // Get value
                            value = views[view].call(undefined, element, dimensions, scrollPosition, windowHeight, documentHeight, preferences);
                            // Continue if nothing changed
                            if ((angular.equals(value, method.value) && preferences.cache) || !flush) {
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
            function getItemIndex(element) {
                var index = -1;
                for (var i = 0; i < items.length; i++) {
                    var item = items[i];
                    if (element instanceof Element && item.node === element) {
                        index = i;
                        break;
                    }
                    if (angular.isString(element) && element === item.name) {
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
            function getElement(element) {
                if (element instanceof Element) {
                    return element;
                }
                if (angular.isElement(element)) {
                    return element[0];
                }
                if (angular.isArray(element)) {
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
            function setReference(element, name) {
                var reference = getItem(name);
                var item = addItem(element, name);
                // Merge reference methods
                if (reference) {
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
            function getReference(name) {
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
            function getDimensions(element) {
                var item = getItem(element);
                return item.dimensions || {};
            }
            // Exposes public methods
            return {
                setReference: setReference,
                getReference: getItem,
                bind: addMethods,
                unbind: removeMethods,
                refresh: recalculateAndCheckItems,
                recalculate: recalculateItems,
                checkViews: checkItemsViews,
                getDimensions: getDimensions
            };
        }
        return this;
    }
})();
(function () {
    "use strict";
    angular.module('skyVisible').provider('skyVisibleViews', skyVisibleViewsProvider);
    skyVisibleViewsProvider.$inject = [];
    function skyVisibleViewsProvider() {
        var _this = this;
        // Default views
        _this.views = {
            'outer': outerView,
            'inner': innerView
        };
        this.$get = function () {
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
        function outerView(element, dimensions, scrollPosition, windowHeight, documentHeight, preferences) {
            // Bottom position
            var elementOffsetBottom = dimensions.height + dimensions.top;
            // The distance between start and stop
            var range = windowHeight + dimensions.height;
            // foldOffset makes sure, that even if an element is above the fold,
            // the progress starts at 0 - it basicly just shortens the range
            if (preferences.foldOffset) {
                range -= dimensions.top < windowHeight ? windowHeight - dimensions.top : 0;
            }
            // distance traveled (px)
            var distance = range - (elementOffsetBottom - scrollPosition.y);
            // The progress in percentage
            var progress = distance / range;
            // bottomOffset is a bit like foldOffset, it just makes
            // sure the progress reaces 1 when bottom of the page is reached
            if (preferences.bottomOffset) {
                var bottomOffset = documentHeight - dimensions.top;
                var multiplier = range / bottomOffset;
                if (bottomOffset < range) {
                    progress *= multiplier;
                }
            }
            if (preferences.cap) {
                progress = Math.min(Math.max(progress, 0), 1);
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
            var range = dimensions.height < windowHeight ? windowHeight - dimensions.height : dimensions.height - windowHeight;
            // foldOffset makes sure, that even if an element is above the fold,
            // the progress starts at 0 - it basicly just shortens the range
            if (preferences.foldOffset) {
                range -= (dimensions.top + dimensions.height < windowHeight) ? windowHeight - (dimensions.top + dimensions.height) : 0;
            }
            // distance travled
            var distance = (dimensions.height < windowHeight) ? range - (dimensions.top - scrollPosition.y) : scrollPosition.y - dimensions.top;
            // The progress in percentage
            var progress = distance / range;
            // bottomOffset is a bit like foldOffset, it just makes
            // sure the progress reaces 1 when bottom of the page is reached
            if (preferences.bottomOffset) {
                var bottomOffset = documentHeight - (dimensions.top + dimensions.height);
                var multiplier = range / bottomOffset;
                if (bottomOffset < range) {
                    progress *= multiplier;
                }
            }
            if (preferences.cap) {
                progress = Math.min(Math.max(progress, 0), 1);
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
