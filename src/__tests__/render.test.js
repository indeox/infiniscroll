const test = require('tape');
const render = require('../render');
import { isVisible } from "../rect";

// Build test content
const NUM_OF_ITEMS = 20;
const sampleText = `
  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
  Donec vitae pharetra tellus. Nam nec dapibus nulla. Nunc
  id purus quis erat gravida dictum a vitae purus. Quisque
  luctus placerat nibh in bibendum.
`;

const fixture = document.createElement('div');
fixture.innerHTML = `
  <style>
    .column {
      width: 200px;
      height: 300px;
      overflow: auto;
      outline: 1px solid red;
    }

    .__container {
      background: rgba(0,255,0,.1);
      outline: 1px solid green;
    }

    .__slice {
      background: rgba(0,0,255,.1);
      outline: 1px solid blue;
    }
  </style>
  <div class="column"></div>
`;
document.body.appendChild(fixture);

const columnEl = document.querySelector('.column');
const content = Array(NUM_OF_ITEMS).fill().map((_, index) => {
  let node = document.createElement('div');
  node.innerHTML = `<div class="item">${sampleText}</div>`;

  return {
    id: index,
    node: node.firstChild
  }
});

test('basic render test', (t) => {
  const output = render({}, {
    $target: columnEl,
    content: content,
    debug: true
  });

  t.ok(isVisible(content[0].node));
  t.ok([...columnEl.querySelectorAll('.item')].filter(isVisible).length > 2);

  t.end();
});

test('scroll to pivot test', (t) => {
  const output = render({}, {
    $target: columnEl,
    content: content,
    pivotItem: content[4],
    debug: true
  });

  t.ok([...columnEl.querySelectorAll('.item')].filter(isVisible).length > 2);
  t.ok(isVisible(output.pivotItem.node));

  t.end();
});

test('scroll to pivot with offset test', (t) => {
  const output = render({}, {
    $target: columnEl,
    content: content,
    pivotItem: content[4],
    pivotOffset: 10,
    debug: true
  });

  t.ok([...columnEl.querySelectorAll('.item')].filter(isVisible).length > 2);
  t.ok(isVisible(output.pivotItem.node));

  t.end();
});
