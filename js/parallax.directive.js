(function() {
	"use strict";

	angular.module('demo').directive('parallax', parallaxDirective);

	parallaxDirective.$inject = ['skyVisible'];

	function parallaxDirective(skyVisible) {
		return {
			link:link
		};

		function link(scope, element, attrs) {
			var view = attrs.parallax;

			skyVisible.bind(element, view, function(values) {
				element.children().css({
					transform:'translateY(' + distance + 'px)'
				});
			});

			skyVisible.bind('stickyElement', 'sticky', function(offsetTop) {
				element.css('top', offsetTop + 'px');
			});

		}
	}
})();
