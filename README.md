# InfiniScroll

[![Build Status](https://travis-ci.org/indeox/infiniscroll.svg?branch=master)](https://travis-ci.org/indeox/infiniscroll)

**WIP** Infinite lists in the browser.

## Getting started

```sh
npm install
npm start
```

To test:

```sh
npm test
```

## Design

The guiding design principle here is, *"What would the browser do?"*.

If web browsers provided an scrolling list primitive, how would it work? What would its API be? What would it do for you?

We think this means:

- Handed a list of elements (plus some metadata), render them in order
- Keep the underlying DOM-tree small, while always keeping content visible to the user
- Don't break user's expectations when the list changes, by keeping as much of what *was* visible on-screen
- Be performant (60fps, ~10ms per pass budget)

### The slice

The key problem to solve is that the browser can't keep every list in the DOM as it causes performance issues. However, ideally the user should not be aware that anything less than allthe available content is in the list.

To keep the DOM tree small while keeping the list size perceptible, we will only render a **slice** of the whole list, and position so that it's on screen. A container around the slice will be sized to give the illusion that the full list is rendered.

To accomodate for scroll changes, we'll also render some additional content around what *would* be onscreen. This is called the **buffer**.

Here's our first constraint:

> We must know the height of all elements in the list.

If the heights change, we must accomodate that too.

### Heights

Before a list item is rendered in the list, we do not know its height. However, to render the correct slice when the list changes, we must know all the heights of all the elements.

To accomodate for this, we will:

- assume a height for each item (which may come from a cache)
- insert and measure the item when it is calculated to appear in the slice
- choose a new slice based on our new new height knowledge
- schedule another list pass

However, this is made more difficult dues to another constraint:

> We cannot ever render the whole list and we cannot render new items if they appear at the top of the list while we are scrolled down as there may be hundreds.

To compensate, we'll adjust the user's scroll position if new, offscreen items arrive using an assumed height, and adjust when we know the real height.

For example, we have a list of 10 items with real heights, and we assume a height of 10px for new items:

```
[ a: 10px ]
[ b: 15px ]
[ c: 10px ]
[ d: 10px ]
[ e: 15px ]
[ f: 20px ]
[ g: 10px ]
[ h: 15px ]
[ i:  5px ]
[ j: 10px ]
```

The user is scrolled 43px down with a 30px viewport, so the list is rendered:

```
|
| 35px buffer
|
[ d: 10px ] <-- 43px
[ e: 15px ]
[ f: 20px ] <-- 73px
|
|
| 40px buffer
|
```

If a new item is added to the top of the list, we assume a height of 10px.

Normally, we would now adjust the buffer to 45px and the user's scroll position by 10px, to 53px:

```
|
| 45px buffer
|
|
[ d: 10px ] <-- 53px
[ e: 15px ]
[ f: 20px ] <-- 83px
|
|
| 40px buffer
|
```

If a rendered item's height has changed, we will also take this into account when adjusting the scroll position.

For example, if item `d` resizes to 8px, we will fix the offset from item `e` (as it is the first item where the top of the rendered node is on-screen) by removing 2px to the scroll position:

```
|
| 35px buffer
|
[ d:  8px ] <-- 41px
[ e: 15px ]
[ f: 20px ] <-- 71px
|
|
| 40px buffer
|
```

If these two happen in combination (new item and `d` resize) we:

- adjust 10px extra for the new item
- remove 2px for the onscreen height change

This leads to an adjusted scroll position of 8px:

```
|
| 45px buffer
|
|
[ d:  8px ] <-- 51px
[ e: 15px ]
[ f: 20px ] <-- 81px
|
|
| 40px buffer
|
```

### Scroll position changes

The other case to adjust for is a real change in the user's scroll position. This can happen for two reasons:

- the user has scrolled
- an onscreen node has changed height

After compensating the onscreen node heights, we will calculate the real change in scroll position was and use that to generate a new slice.

For example, give the same initial starting place as above:

```
|
| 35px buffer
|
[ d: 10px ] <-- 43px
[ e: 15px ]
[ f: 20px ] <-- 73px
|
|
| 40px buffer
|
```

If the user scrolls 9px up, we would take this into account by rendering node `c` which is 10px high:

```
| 25px buffer
|
[ c: 10px ] <-- 34px
[ d: 10px ]
[ e: 15px ]
[ f: 20px ] <-- 64px
|
|
| 40px buffer
|
```

However, if node `c` were re-rendered and found to be 15px, we would have to take this into account:

- the buffer is still 25px as nodes `a` and `b` are 25px in total
- the change in node height will have led to a 5px push-down of previously rendered, onscreen content (`d`, `e` and `f`)
- the user has scrolled up 9px

To take this into account, we take the 9px off the previous scroll postion and add the 5px pushdown back:

```
43px + -9px = 34px
34px +  5px = 38px
```

Therefore the net scroll change is -4px (4px up) to 38px:

```
| 25px buffer
|
[ c: 15px ] <-- 38px
[ d: 10px ]
[ e: 15px ]
[ f: 20px ] <-- 68px
|
|
| 40px buffer
|
```

## Reordering

List reordering *should* be catered for the by on-screen height changing code as we will fix to an onscreen item. This needs further work.

## Removal

Items being removed is not problem unless the item is onscreen. In this scenario, we will choose the best available candidate *down* the list from the first onscreen, so that the offset from the start of the list is maintained.

## Focus

The scroller should be agnostic of the content inside it, which includes form elements and other interactive UI.

Browser behaviour dictates that, when an element is removed from the DOM, it loses focus. This is a problem becuase a list item does not have to go far off the screen to be removed, but the user's expectation is that the focus will remain.

In this case the answer to the question, *"what would the browser do?"* is that it would make sure focus was not lost.

To make this happen we must restore focus to any previously focused element that we removed from the DOM.
