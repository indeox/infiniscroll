const test = require('tape');
const render = require('../render');

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

    .container {
      background: rgba(0,255,0,.1);
      outline: 1px solid green;
    }

    .slice {
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
    content: content
  });

  t.equal(output.content.length, 20);
  t.equal(columnEl.querySelectorAll('.item').length, 3);

  t.end();
});

test('basic render test with a larger viewport', (t) => {
  const output = render({}, {
    $target: columnEl,
    content: content
  });

  t.equal(output.content.length, 20);
  t.equal(columnEl.querySelectorAll('.item').length, 3);

  t.end();
});

test('scroll to pivot test', (t) => {
  const output = render({}, {
    $target: columnEl,
    content: content,
    pivot: content[4]
  });

  t.equal(output.content.length, 20);
  t.equal(columnEl.scrollTop, 576);
  t.equal(columnEl.querySelectorAll('.item').length, 4);

  t.end();
});

test('scroll to pivot with offset test', (t) => {
  const output = render({
    $target: columnEl,
    content: content,
    pivot: content[4],
    offset: 10
  });

  t.equal(output.content.length, 20);
  t.equal(columnEl.scrollTop, 566);
  t.equal(columnEl.querySelectorAll('.item').length, 4);

  t.end();
});

test.only('scroll to offset test', (t) => {
  const output = render({}, {
    $target: columnEl,
    content: content,
    offset: -10
  });

  t.equal(output.content.length, 20);
  t.equal(columnEl.scrollTop, 10);
  t.equal(columnEl.querySelectorAll('.item').length, 4);

  t.end();
});
