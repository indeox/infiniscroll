const THRESHOLD = 100;

function sum(arr) {
    return arr.reduce((a, b) => a + b, 0);
}

function render({
    $target,
    content = [],
    pivot = content[0],
    offset = 0,
    heightCache = {}
}) {
    const $slice = $target.querySelector('.slice');
    const $container = $target.querySelector('.container');

    const getHeight = ({ id }) => heightCache[id];

    // Render content in the $target node
    $slice.innerHTML = '';
    $slice.style.transform = '';
    content.forEach(({id, node}, index) => {
        $slice.appendChild(node);
        heightCache[id] = node.offsetHeight;
    });

    // Scroll to pivot!
    const pivotIndex = content.indexOf(pivot);
    const nodesBeforePivot = content.slice(0, pivotIndex);
    const spaceBeforePivot = sum(nodesBeforePivot.map(getHeight));
    // Viewport height should be use clientHeight to avoid a measurement that includes
    // the border, as this will throw off the calculation below
    const viewportHeight = $target.clientHeight; // TODO cacheable
    const containerHeight = $container.offsetHeight; // TODO cacheable
    // Don't over-scroll
    const scrollTop = Math.min(
        spaceBeforePivot - offset,
        containerHeight - viewportHeight
    );

    // Remove pointless nodes and build the bumper
    const startOffset = scrollTop - THRESHOLD;
    const endOffset = scrollTop + viewportHeight + THRESHOLD;
    // TODO suuuuuper inefficient
    const heightSums = content.map((_, i) => sum(content.slice(0, i+1).map(getHeight)));

    const numNodesBeforeStart = heightSums.filter(sum => sum < startOffset).length;
    const numNodesBeforeEnd = heightSums.filter(sum => sum < endOffset).length;

    const itemsBeforeStart = content.slice(0, numNodesBeforeStart);
    const itemsAfterEnd = content.slice(numNodesBeforeEnd + 1);

    // How much space do we need to replace at the bottom
    const offsetFromTop = sum(itemsBeforeStart.map(getHeight));

    // Move the scroll position
    $target.scrollTop = scrollTop;

    // Translate & bumper!
    $slice.style.transform = `translateY(${offsetFromTop}px)`;
    $container.style.height = `${containerHeight}px`;

    // Remove nodes before and after
    itemsBeforeStart.forEach(({ node }) => $slice.removeChild(node));
    itemsAfterEnd.forEach(({ node }) => $slice.removeChild(node));


    return {
        $target,
        heightCache,
        content,
        pivot,
        offset
    };
}

module.exports = render;
