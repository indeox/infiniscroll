import test from 'tape';
import render from '../render';
import { getRect } from '../rect';
import { isVisible } from "../rect";

import page from './page.html';
import item from './item.html';

function renderHtml(html) {
  const node = document.createElement('div');
  node.innerHTML = html;
  return node.firstChild;
}

function makeContent(size) {
  return Array(size).fill().map((_, i) => ({
    id: i,
    node: renderHtml(item)
  }));
}

function setup() {
  document.body.innerHTML = '';
  document.body.appendChild(renderHtml(page));
  return [ document.querySelector('.container') ];
}

test('basic render', t => {
  const content = makeContent(20);
  const [ $container ] = setup();
  const output = render({}, {
    $container,
    content
  });
  t.ok(isVisible(content[0].node));
  t.end();
});

test('only a few nodes are rendered', t => {
  const content = makeContent(20);
  const [ $container ] = setup();
  const output = render({}, {
    $container,
    content
  });
  t.ok(isVisible(content[0].node));
  t.ok([...$container.querySelectorAll('.item')].filter(isVisible).length > 1);
  t.ok([...$container.querySelectorAll('.item')].filter(isVisible).length < content.length);
  t.ok([...$container.querySelectorAll('.item')].length < 5);
  t.end();
});

test('the scollable region is the full height of the list', t => {
  const content = makeContent(20);
  const [ $container ] = setup();
  const output = render({}, {
    $container,
    content,
    defaultHeight: 100
  });
  const expectedTotalHeight = 100 * content.length;
  t.equal($container.scrollHeight, expectedTotalHeight);
  t.end();
});


