import { getSlice } from './slice';
import { getRect } from './rect';
import { getOrCreateElements } from "./domUtils";
import { sum } from './sumUtils';

module.exports = function render({
  heightCache: previousHeightCache = {}
} = {}, {
  $container,
  content = [],
  scrollTop = 0,
  defaultHeight = 100,
  buffer = 200
} = {}) {
  const [ $runway, $slice ] = getOrCreateElements($container);
  const viewportHeight = getRect($container).height;

  const contentWithHeights = content.map(item => ({
    height: previousHeightCache[item.id] || defaultHeight,
    item
  }));
  const totalHeight = sum(contentWithHeights.map(({ height }) => height));

  const [ sliceStart, sliceEnd ] = getSlice(
    { buffer },
    [ scrollTop, viewportHeight ],
    contentWithHeights
  );

  const runwayPadding = sum(
    contentWithHeights
      .slice(0, sliceStart)
      .map(({ height }) => height)
  );

  const slice = content.slice(sliceStart, sliceEnd);

  $runway.style.height = `${totalHeight}px`;
  $slice.style.transform = `translateY(${runwayPadding}px)`;
  $slice.innerHTML = '';
  slice.forEach(item => {
    $slice.appendChild(item.node);
  });

  const heightCache = slice.reduce(
    (acc, { id, node }) => ({
      ...acc,
      [id]: getRect(node).height
    }),
    previousHeightCache
  );

  return { heightCache };
}
