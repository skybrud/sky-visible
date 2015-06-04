# Sky-visible
`sky-visilbe` is in It's simplest form a service that trackes the progress, of an element, across the viewport. It uses custom methods to calculate where any given element is. This makes it highly cusomizable - and extremly easy to use.

## Tell me more!
So.. your interested? good! `sky-visbile` is a tool that measures and keeps track of any given `DOM-Element`. It calculates It's dimentions, keeps track of the window position and with a little help from the customized calculation methods, also known as `views` - it determins the elements progress from **a** to **b**.

This is usefull when doing parallax, sticky navigations, fading elements in as you scroll, lazy loading, toggle states as they apear or even something as usefull as prompting users with an alert box when they reach the bottom. You should totaly do that, they would love it.

###Views
As i mentioned earlier `sky-visible` is highly customizable. This is thanks to the customizable calculation methods, refered to as `views`. You should think of these views as cusomizable `viewports`. I'll try to give you an example by showing you a view and using my ASCII art abilities.

```
           view
----------- b -------------
|                         |
|       --- A ---         |
|       |       |         |
|       |  BOX  |         |
|       |       |         |
|       --- B ---         |
|                         |
----------- a -------------
```
The art above illustrates how you should think of sky-visible `views`. Their job is to calculate the distance from **a** to **b**. In this case it starts when `a` and `A` align, and finish when `b` and `B` align. The progress should then be returned as progress or distance in px. In the example above the box is **50%** through the view.

Below you'll find the actual view - hope this gives you a better idea of what the hell i'm talking about.
```javascript
/**
 * Starts: element top >= scrollPositionBbottom
 * Ends: element bottom <= scrollPosition
 *
 * values:
 *      progress 0-1
 *      distance px
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

	// The distance between start and stop, in this case
	// the height of the screen + the element height
	var range = windowHeight + dimentions.height;

	// How far has it moved (px)
	var distance = Math.min(Math.max(range - (elementOffsetBottom - scrollPosition.y), 0), range);

	// The progress in percentage
	var progress = Math.min(Math.max(distance / range , 0), 1);

	// Returns an object, with distance and progress,
	// which is passed to the callback function
	return {
		progress: progress,
		distance: distance
	};
}
```

## Usage
Using `sky-visible` is pretty streight forward.

### Basic usage
A simpel binding with a callback - we'll use the view explained above.
```javascript
/**
 * Bind an element to a view
 *
 * @param {array|node} element
 * @param {string} view name
 * @param {object} preferences [optional]
 * @param {function} callback method
 */
skyVisible.bind(element, 'outer', preferences, function(values) {
    // The returned progress is between 0 - 1.
    var progress = values.progress * 10; // move from 0 - 10%
	element.style.transform =  'translateY(' + progress + '%)';
});
```

### References usage
Accessing elements through out the app can at times be a hassle. It shouldn't be. Making elements act according to other elements through out the design of a website should be streight forward and relaiable.
This is where the term `reference` joins the game. Refereing to an element in `sky-visible` will blow your mind. You heard me right - It's MINDBLOWING.
```javascript
// Somewhere in your code
skyVisible.setReference(element, 'awesomeElement');

// Somewhere entirely different
skyVisable.bind('awesomeElement', 'outer', preferences, function(values) {
    var element = this;
    /**
     * BOOOOOOM!
     */
});
```
It's now posible to bind methods to the element, without pasing the element, but the reference name! You're welcome.

## Exposed methods
#####.bind(element, [view], [preferences], method)
Bind a method to an element or a reference name.
```javascript
/**
 * @param {array|node} element - an array of elements or a single element
 * @param {string} view name
 * @param {object} preferences [optional]
 * @param {function} callback method
 */
skyVisible.bind(element, 'outer', preferences, function(values) {
    /**
     * values:
     *      progress: 0-1
     *      distance: distances moved in px
     */
});
```

#####.unbind(element, [view], [method])
Unbind a method, a specific view or an entire element
```javascript
/**
 * @param {node|string} element or reference
 * @param {string} view [optional] - removes all methods to a specific view
 * @param {function} method [optional] - removes a specific method
 */
 skyVisible.unbind(element, 'outer', method);
```

#####.setReference(element, name);
Give a specific element a reference name. An element **can't** have more then one reference name - and setting two wil simply overwrite.
```javascript
/**
 * @param {node} element
 * @param {string} reference name
 */
skyVisble.setReference(element, 'backgroundImage');
```

#####.getReference(name)
Get an element based on it's reference name
```javascript
/**
 * @param {string} name
 * @return {node|boolean} will return false if no elements found
 */
skyVisible.getReferences('backgroundImage');
```


#####.recalcualte([element|name])
This will recalculate the position and dimention of all elements bound to skyVisible.
```javascript
/**
 * @param {node|string} you can pass either the element or the
 *                      reference to recalculate a specific element
 */
skyVisible.recalculate():
```

#####.checkViews([element|name])
Wil run through all elements and check their progress in all the views they are assigned to
```javascript
/**
 * @param {node|string} pasing an element or a references name
 *                      will enable you to check a specifik element
 */
skyVisible.checkViews();
```


## Questions & feedback
Please do us the favour and go nuts - we are very interessted in feedback, and are more then glad to answer your questions! As questions bump in we'll make a small Q&A.

twitter [@schonert](http://twitter.com/schonert)
mail [sschonert@skybrud.dk](mailto:sschonert@skybrud.dk)


## Contributions
Give it a try - if you have any suggestion, bugfixes, new features or usefull views make a pull request! 3. 2. 1. GO!
















