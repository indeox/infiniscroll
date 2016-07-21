import diff from "./diff";
import restoreFocus from "./restoreFocus";

const CONTAINER_CLASS = '__container';
const SLICE_CLASS = '__slice';

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

function sumLeft(arr) {
    return arr.reduce(
        ({ total, acc }, v) => ({ total: total + v, acc: [...acc, total + v] }),
        { total: 0, acc: [] }
    ).acc;
}

function insertAfter($new, $ref) {
    $ref.parentNode.insertBefore($new, $ref.nextSibling);
}

function getElements($target, [$previousContainer, $previousSlice]) {
    let $container = $previousContainer || $target.querySelector(`.${CONTAINER_CLASS}`);

    if (!$container) {
        $container = document.createElement('div');
        $container.setAttribute('class', CONTAINER_CLASS);
        $target.appendChild($container);
    }

    let $slice = $previousSlice || $container.querySelector(`.${SLICE_CLASS}`);

    if (!$slice) {
        $slice = document.createElement('div');
        $slice.setAttribute('class', SLICE_CLASS);
        $container.appendChild($slice);
    }

    return [$container, $slice];
}

function calculateHeights(content, $slice, heightCache = {}) {
    var totalHeight = 0;
    var newItems = [];
    content.forEach((item, index) => {
        const {id, node} = item;
        if (!heightCache.hasOwnProperty(id)) {
            $slice.appendChild(node);
            heightCache[id] = node.offsetHeight;
            newItems.push(item);
        }
        totalHeight += heightCache[id];
    });
    return [totalHeight, heightCache, newItems];
}

const opToFn = {
    // Remove
    '-': ($parent, $node) => $parent.removeChild($node),
    // Paste (has moved from somewhere else)
    'p': (...args) => {
        opToFn['+'](...args);
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
    $slice: $previousSlice,
    $container: $previousContainer,
    viewportHeight: previousViewportHeight,
    containerHeight: previousContainerHeight,
    heightCache: previousHeightCache = {},
    renderedItems: previousRenderedItems = [],
    totalHeight: previousTotalHeight,
    offsetFromTop: previousOffsetFromTop,
    threshold: previousThreshold,
    $activeElement: $previousActiveElement
}, {
    $target,
    content = [],
    pivotItem,
    pivotOffset = 0,
    threshold = previousThreshold || 200
}) {
    const [$container, $slice] = getElements($target, [$previousContainer, $previousSlice]);

    // Measure the heights and track new items
    const [
        totalHeight,
        heightCache,
        newItems
    ] = calculateHeights(content, $slice, previousHeightCache);

    // Quick access to item heights
    const getHeight = makeGetHeight(heightCache);

    // Viewport height should be use clientHeight to avoid a measurement that includes
    // the border, as this will throw off the calculation below
    const viewportHeight = previousViewportHeight || $target.clientHeight;
    const containerHeight = previousContainerHeight || $container.offsetHeight;

    // We only care about moving the pivot if one was supplied, possibly with an offset.
    let targetScrollPosition;
    if (pivotItem) {
        const pivotIndex = content.indexOf(pivotItem);
        const nodesBeforePivot = content.slice(0, pivotIndex);
        const spaceBeforePivot = sum(nodesBeforePivot.map(getHeight));
        targetScrollPosition = spaceBeforePivot - pivotOffset;
    } else {
        targetScrollPosition = $target.scrollTop;
    }

    // Don't over-scroll
    const scrollTop = getBestScrollTop(
        containerHeight,
        viewportHeight,
        targetScrollPosition
    );

    // What to render?
    const startOffset = scrollTop - threshold;
    const endOffset = scrollTop + viewportHeight + threshold;
    const heightSums = sumLeft(content.map(getHeight));

    const numNodesBeforeStart = heightSums.filter(sum => sum < startOffset).length;
    const numNodesBeforeEnd = heightSums.filter(sum => sum < endOffset).length + 1;

    const itemsBeforeStart = content.slice(0, numNodesBeforeStart);
    const itemsAfterEnd = content.slice(numNodesBeforeEnd);
    const renderedItems = content.slice(
        numNodesBeforeStart,
        numNodesBeforeEnd
    );

    // What do we need to change?
    // By default we assume we rendered everything
    const changes = diff(previousRenderedItems.concat(newItems), renderedItems);

    // How much space do we need to replace at the top?
    const offsetFromTop = sum(itemsBeforeStart.map(getHeight));

    // Make the changes!
    const [
        didRestoreFocus,
        $activeElement
    ] = restoreFocus(
        $target,
        () => {
            let $lastNode;
            changes.forEach(([op, items]) => {
                items.forEach(({ node: $node, id }) => {
                    opToFn[op]($slice, $node, $lastNode);
                    $lastNode = $node;
                });
            });
        },
        { $activeElement: $previousActiveElement }
    );

    if (pivotItem || didRestoreFocus) {
        $target.scrollTop = scrollTop;
    }
    // Translate & bumper!
    if (offsetFromTop !== previousOffsetFromTop) {
        $slice.style.transform = `translateY(${offsetFromTop}px)`;
    }
    if (totalHeight !== previousTotalHeight) {
        $container.style.height = `${totalHeight}px`;
    }

    return {
        $target,
        heightCache,
        content,
        $slice,
        $container,
        viewportHeight,
        containerHeight,
        renderedItems,
        totalHeight,
        offsetFromTop,
        threshold,
        $activeElement
    };
}

module.exports = render;
