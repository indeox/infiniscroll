import { renderHtml, makeContent } from './html';
import render from './render';

import page from './__tests__/page.html';
import item from './__tests__/item.html';

function setup() {
  document.body.innerHTML = '';
  document.body.appendChild(renderHtml(page));
  return [ document.querySelector('.container') ];
}

window.addEventListener('load', () => {
  const [ $container ] = setup();
  const content = makeContent(100, item);
  let previousOutput = render({}, {
    $container,
    content
  });

  $container.addEventListener('scroll', () => {
    console.log('----------');
    console.log({ previousOutput })
    let newOutput = render(previousOutput, {
      $container,
      scrollTop: $container.scrollTop,
      content
    });
    console.log({ newOutput })
    previousOutput = newOutput;
  });
});
