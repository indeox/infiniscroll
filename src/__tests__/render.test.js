import test from 'tape';
import render from '../render';
import { getRect } from '../rect';
import { isVisible } from "../rect";
import { renderHtml, makeContent } from '../html';

import page from './page.html';
import item from './item.html';

function checkVisibility(t, content, i) {
  content[i].node.classList.add('visibility-check');
  t.ok(isVisible(content[i].node), `The [${i}]th item is visible`);
}

function setup() {
  document.body.innerHTML = '';
  document.body.appendChild(renderHtml(page));
  return [ document.querySelector('.container') ];
}

test('basic render', t => {
  const content = makeContent(20, item);
  const [ $container ] = setup();
  const output = render({}, {
    $container,
    content
  });
  t.ok(isVisible(content[0].node));
  t.end();
});

test('only a few nodes are rendered', t => {
  const content = makeContent(20, item);
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
  const content = makeContent(20, item);
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

test.only('renders visible content from scroll position', t => {
  const content = makeContent(20, item);
  const [ $container ] = setup();
  const scrollTop = 160;
  const output = render({}, {
    $container,
    content,
    scrollTop: scrollTop,
    defaultHeight: 100
  });
  $container.scrollTop = scrollTop;
  t.equal($container.scrollTop, scrollTop, 'Scroll position is correct');
  checkVisibility(t, content, 1);
  checkVisibility(t, content, 2);
  checkVisibility(t, content, 3);
  t.ok([...$container.querySelectorAll('.item')].filter(isVisible).length > 1);
  t.ok([...$container.querySelectorAll('.item')].filter(isVisible).length < content.length);
  t.ok([...$container.querySelectorAll('.item')].length < 5);
  t.end();
});

