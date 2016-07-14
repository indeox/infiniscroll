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
    content.forEach(({id, node}) => {
        $slice.appendChild(node);
        heightCache[id] = node.offsetHeight;
    });

    // Scroll to pivot!
    const pivotIndex = content.indexOf(pivot);
    const nodesBeforePivot = content.slice(0, pivotIndex);
    const spaceBeforePivot = sum(nodesBeforePivot.map(getHeight));
    const scrollTop = spaceBeforePivot - offset;

    // Remove pointless nodes and build the bumper
    const viewportHeight = $target.offsetHeight; // TODO cacheable
    console.log('viewportHeight', viewportHeight);
    const startOffset = scrollTop - THRESHOLD;
    const endOffset = scrollTop + viewportHeight + THRESHOLD;
    console.log('startOffset', startOffset);
    console.log('endOffset', endOffset);
    // TODO suuuuuper inefficient
    const heightSums = content.map((_, i) => sum(content.slice(0, i+1).map(getHeight)));
    console.log('heightSums', heightSums);

    const numNodesBeforeStart = heightSums.filter(sum => sum < startOffset).length;
    // - 1 so that the we include the node where the sum is now greater
    // TODO this needs clarification
    const numNodesAfterEnd = heightSums.filter(sum => sum > endOffset).length - 1;
    console.log('numNodesBeforeStart', numNodesBeforeStart);
    console.log('numNodesAfterEnd', numNodesAfterEnd);

    const itemsBeforeStart = content.slice(0, numNodesBeforeStart);
    const itemsAfterEnd = content.slice(-numNodesAfterEnd);

    // How much space do we need to replace at the bottom
    const offsetFromTop = sum(itemsBeforeStart.map(getHeight));
    const offsetAtBottom = sum(itemsAfterEnd.map(getHeight));

    // Move the scroll position
    $target.scrollTop = scrollTop;

    // Translate & bumper!
    $slice.style.transform = `translateY(${offsetFromTop}px)`;
    const [totalHeight = 0] = heightSums.slice(-1);
    $container.style.height = `${totalHeight}px`;

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
