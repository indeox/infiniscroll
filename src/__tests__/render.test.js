const test = require('tape');
const render = require('../render');

// Build test content
const NUM_OF_ITEMS = 20;
const sampleText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec vitae pharetra tellus. Nam nec dapibus nulla. Nunc id purus quis erat gravida dictum a vitae purus. Quisque luctus placerat nibh in bibendum.'
const sampleContent = Array(NUM_OF_ITEMS).fill().map((_, index) => {
  return {
    id: index,
    html: `<div class="item">${sampleText}</div>`
  }
});

const columnEl = document.querySelector('.column');
const content = sampleContent.map(function(item) {
  let elToInsert = document.createElement('div');
  elToInsert.innerHTML = item.html;
  elToInsert = elToInsert.firstChild;

  return {
    id: item.id,
    node: elToInsert
  }
});



test('basic render test', (t) => {
  const output = render({
    $target: columnEl,
    content: content
  });

  t.equal(output.content.length, 20);
  t.equal(columnEl.querySelectorAll('.item').length, 3);

  t.end();
});

test('basic render test with a larger viewport', (t) => {
  const output = render({
    $target: columnEl,
    content: content
  });

  t.equal(output.content.length, 20);
  t.equal(columnEl.querySelectorAll('.item').length, 3);

  t.end();
});

test('scroll to pivot test', (t) => {
  const output = render({
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
  const output = render({
    $target: columnEl,
    content: content,
    offset: -10
  });

  t.equal(output.content.length, 20);
  t.equal(columnEl.scrollTop, 10);
  t.equal(columnEl.querySelectorAll('.item').length, 4);

  t.end();
});
