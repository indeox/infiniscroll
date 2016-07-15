import diff from "./diff";

const THRESHOLD = 100;

function sum(arr) {
    return arr.reduce((a, b) => a + b, 0);
}

function makeGetHeight(cache) {
    return ({ id }) => cache[id];
}

function getBestScrollTop(containerHeight, viewportHeight, targetScrollTop) {
    return Math.min(
        targetScrollTop,
        containerHeight - viewportHeight
    );
}

function insertAfter($new, $ref) {
    $ref.parentNode.insertBefore($new, $ref.nextSibling);
}

const opToFn = {
    // Remove
    '-': ($parent, $node) => $parent.removeChild($node),
    // Paste (has moved from somewhere else)
    'p': ($parent, $node, $lastNode) => {
        $parent.removeChild($node);
        opToFn['+']($parent, $node, $lastNode);
    },
    '=': () => {},
    'x': () => {},
    '+': ($parent, $node, $lastNode) => {
        if ($lastNode && $lastNode.parentNode) {
            insertAfter($node, $lastNode);
        } else {
            $parent.insertBefore($node, $parent.firstChild);
        }
    }
};

function render({
    // These values act as memory for this function. They should all be optional
    // and be present on the output object.
    scrollTop: previousScrollTop = 0,
    $slice: $previousSlice,
    $container: $previousContainer,
    viewportHeight: previousViewportHeight,
    containerHeight: previousContainerHeight,
    heightCache = {},
    renderedItems: previousRenderedItems
}, {
    $target,
    content = [],
    pivot = content[0],
    offset = 0
}) {
    const $slice = $previousSlice || $target.querySelector('.slice');
    const $container = $previousContainer || $target.querySelector('.container');

    // Quick access to item heights
    const getHeight = makeGetHeight(heightCache);

    // Render content in the $target node
    $slice.style.transform = '';

    var totalHeight = 0;
    content.forEach(({id, node}, index) => {
        if (!heightCache.hasOwnProperty(id)) {
            $slice.appendChild(node);
            heightCache[id] = node.offsetHeight;
        }
        totalHeight += heightCache[id];
    });

    // Viewport height should be use clientHeight to avoid a measurement that includes
    // the border, as this will throw off the calculation below
    const viewportHeight = $target.clientHeight; // TODO cacheable
    const containerHeight = $container.offsetHeight; // TODO cacheable

    // How far down the list should we be scrolled?
    const pivotIndex = content.indexOf(pivot);
    const nodesBeforePivot = content.slice(0, pivotIndex);
    const spaceBeforePivot = sum(nodesBeforePivot.map(getHeight));
    // Don't over-scroll
    const scrollTop = getBestScrollTop(
        containerHeight,
        viewportHeight,
        spaceBeforePivot - offset
    );

    // Remove pointless nodes and build the bumper
    const startOffset = scrollTop - THRESHOLD;
    const endOffset = scrollTop + viewportHeight + THRESHOLD;
    // TODO suuuuuper inefficient
    const heightSums = content.map((_, i) => sum(content.slice(0, i+1).map(getHeight)));

    const numNodesBeforeStart = heightSums.filter(sum => sum < startOffset).length;
    const numNodesBeforeEnd = heightSums.filter(sum => sum < endOffset).length + 1;

    const itemsBeforeStart = content.slice(0, numNodesBeforeStart);
    const itemsAfterEnd = content.slice(numNodesBeforeEnd);
    const renderedItems = content.slice(
        numNodesBeforeStart,
        numNodesBeforeEnd
    );

    // How much space do we need to replace at the bottom
    const offsetFromTop = sum(itemsBeforeStart.map(getHeight));

    // Move the scroll position
    if (scrollTop !== previousScrollTop) {
        $target.scrollTop = scrollTop;
    } else {
        console.log('skipping setting scrollTop');
    }

    // Translate & bumper!
    $slice.style.transform = `translateY(${offsetFromTop}px)`;
    $container.style.height = `${totalHeight}px`;

    // Remove nodes before and after
    const changes = diff(previousRenderedItems || content, renderedItems);

    var $lastNode;
    changes.forEach(([op, items]) => {
        items.forEach(({ node: $node, id }) => {
            opToFn[op]($slice, $node, $lastNode);
            $lastNode = $node;
        });
    });

    return {
        $target,
        heightCache,
        content,
        pivot,
        offset,
        scrollTop,
        $slice,
        $container,
        viewportHeight,
        containerHeight,
        renderedItems
    };
}

module.exports = render;
