import { getSlice } from './slice';

module.exports = function render({
} = {}, {
  $container,
  content = []
} = {}) {
  content.forEach(({ node }) => {
    $container.appendChild(node);
  });
}
