import { getSlice } from './slice';
import { getRect } from './rect';

module.exports = function render({
} = {}, {
  $container,
  content = []
} = {}) {
  const viewportHeight = getRect($container).height;
  const contentWithHeights = content.map(item => ({ height: 100, item }));
  const [ sliceStart, sliceEnd ] = getSlice({}, [ 0, viewportHeight ], contentWithHeights);

  content.slice(sliceStart, sliceEnd).forEach(({ node }) => {
    $container.appendChild(node);
  });
}
