import { getSlice } from './slice';
import { getRect } from './rect';
import { getOrCreateElements } from "./domUtils";
import { sum } from './sumUtils';

module.exports = function render({
} = {}, {
  $container,
  content = [],
  defaultHeight = 100
} = {}) {
  const [ $runway ] = getOrCreateElements($container);
  const viewportHeight = getRect($container).height;

  const contentWithHeights = content.map(item => ({ height: defaultHeight, item }));
  const totalHeight = sum(contentWithHeights.map(({ height }) => height));

  const [ sliceStart, sliceEnd ] = getSlice({}, [ 0, viewportHeight ], contentWithHeights);

  $runway.style.height = `${totalHeight}px`;
  content.slice(sliceStart, sliceEnd).forEach(({ node }) => {
    $runway.appendChild(node);
  });
}
