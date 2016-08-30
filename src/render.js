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
  defaultHeight = 100
} = {}) {
  const [ $runway, $slice ] = getOrCreateElements($container);
  const viewportHeight = getRect($container).height;

  const contentWithHeights = content.map(item => ({
    height: previousHeightCache[item.id] || defaultHeight,
    item
  }));
  const totalHeight = sum(contentWithHeights.map(({ height }) => height));

  const [ sliceStart, sliceEnd ] = getSlice(
    {},
    [ scrollTop, viewportHeight ],
    contentWithHeights
  );

  const runwayPadding = sum(
    contentWithHeights
      .slice(0, sliceStart)
      .map(({ height }) => height)
  );

  $runway.style.height = `${totalHeight}px`;
  $slice.style.transform = `translateY(${runwayPadding}px)`;
  const toMeasure = content.slice(sliceStart, sliceEnd).map(item => {
    $slice.appendChild(item.node);
    return item;
  });

  const heightCache = toMeasure.reduce(
    (acc, { id, node }) => ({
      ...acc,
      [id]: getRect(node).height
    }),
    {}
  );

  return { heightCache };
}
