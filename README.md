## InfiniScroll

A (still very experimental) way to render large virtual lists in the browser

### To run

```sh
 # First time only
 npm install 

 # Startup
 npm start
```

### Initialisation options
```js
new InfiniScroll({
  // Required
  el: DOMNode,

  // Optional
  renderItem: (itemToRender) => { /* Provide custom renderer */ },
  onScroll: ({distanceFromTop, distanceFromBottom}) => { ... }
});
```

### To use


**Simple setup**
```js
// HTML
<div id="column"></div>

// JS Setup
const column = new InfiniScroll({
  el: document.querySelector('#column')
});

// Add content
const content = [
  {id: 1, html: '<div>This is item 1</div>'},
  {id: 2, html: '<div>This is item 2</div>'},
  {id: 3, html: '<div>This is item 3</div>'},
  {id: 4, html: '<div>This is item 4</div>'}
];

column.addContent(content);        
```

**Using a custom renderer**
```js
// HTML
<div id="column"></div>

// JS Setup
const column = new InfiniScroll({
  el: document.querySelector('#column'),
  renderItem: function(itemToRender) {
    const output = doFancyCustomRendering(itemToRender);
    return output;
  },
});

// Add content
const content = [
  {id: 1, title: 'Title 1', body: 'Body 1'},
  {id: 2, title: 'Title 2', body: 'Body 2'},
  {id: 3, title: 'Title 3', body: 'Body 3'},
  {id: 4, title: 'Title 4', body: 'Body 4'}
];
```

