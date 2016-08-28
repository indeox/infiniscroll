import { getSlice } from './slice';
import { getRect } from './rect';
import { getOrCreateElements } from "./domUtils";
import { sum } from './sumUtils';

module.exports = function render({
} = {}, {
  $container,
  content = [],
  scrollTop = 0,
  defaultHeight = 100
} = {}) {
  const [ $runway, $slice ] = getOrCreateElements($container);
  const viewportHeight = getRect($container).height;

  const contentWithHeights = content.map(item => ({
    height: defaultHeight,
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
  content.slice(sliceStart, sliceEnd).forEach(({ node }) => {
    $slice.appendChild(node);
  });
}
