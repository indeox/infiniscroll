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

function getBestScrollTop(totalHeight, viewportHeight, targetScrollTop) {
    return Math.min(
        targetScrollTop,
        totalHeight - viewportHeight
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
    var changedItems = [];
    content.forEach((item, index) => {
        const {id, node, hasChanged} = item;
        if (!heightCache.hasOwnProperty(id)) {
            $slice.appendChild(node);
            heightCache[id] = node.offsetHeight;
            newItems.push(item);
        }
        if (hasChanged) {
            $slice.appendChild(node);
            heightCache[id] = node.offsetHeight;
            changedItems.push(item);
        }
        totalHeight += heightCache[id];
    });
    return [totalHeight, heightCache, newItems, changedItems];
}

const iff = (
    predicate,
    left = () => {},
    right = () => {}
) => (predicate ? left() : right());

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
    totalHeight: previousTotalHeight,
    heightCache: previousHeightCache = {},
    renderedItems: previousRenderedItems = [],
    offsetFromTop: previousOffsetFromTop,
    threshold: previousThreshold,
    $activeElement: $previousActiveElement,
    visualFixItem: previousVisualFixItem,
    visualFixItemOffset: previousVisualFixItemOffset
}, {
    $target,
    content = [],
    pivotItem,
    pivotOffset = 0,
    threshold = previousThreshold || 400,
    debug = false
}) {
    const [
        $container,
        $slice
    ] = getElements($target, [$previousContainer, $previousSlice]);

    // Measure the heights and track new items
    const [
        totalHeight,
        heightCache,
        newItems,
        changedItems
    ] = calculateHeights(content, $slice, previousHeightCache);

    // Quick access to item heights
    const getHeight = makeGetHeight(heightCache);
    const heightSums = sumLeft(content.map(getHeight));

    // Viewport height should be use clientHeight to avoid a measurement that includes
    // the border, as this will throw off the calculation below;
    const viewportHeight = previousViewportHeight || $target.clientHeight;

    // Should we restore focus around a particular element?
    const fixItem = (changedItems.length ? previousVisualFixItem : pivotItem);
    const fixItemOffset = (changedItems.length ? previousVisualFixItemOffset : pivotOffset)

    const targetScrollPosition = iff(
        fixItem,
        () => {
            // Find the item, figure out how much space is above it now and generate a new
            // scroll position give our previous offset
            const fixItemIndex = content.indexOf(fixItem);
            const fixItemHeightSum = heightSums[fixItemIndex];
            return fixItemHeightSum - fixItemOffset;
        },
        // Otherwise we should just use the element's scroll position
        () => $target.scrollTop
    );

    // Don't over-scroll
    const scrollTop = getBestScrollTop(
        totalHeight,
        viewportHeight,
        targetScrollPosition
    );

    // What to render?
    const startOffset = scrollTop - threshold;
    const endOffset = scrollTop + viewportHeight + threshold;

    const numNodesBeforeStart = heightSums.filter(sum => sum < startOffset).length;
    const numNodesBeforeEnd = heightSums.filter(sum => sum < endOffset).length + 1;

    const itemsBeforeStart = content.slice(0, numNodesBeforeStart);
    const itemsAfterEnd = content.slice(numNodesBeforeEnd);

    // This is what we'll render
    const renderedItems = content.slice(
        numNodesBeforeStart,
        numNodesBeforeEnd
    );

    // Choose a visual fix item. This will be the top partially onscreen node.
    const visualFixItemIndex = heightSums.filter(sum => sum < scrollTop).length;
    const visualFixItem = content[visualFixItemIndex];
    const visualFixItemOffset = heightSums[visualFixItemIndex] - scrollTop;

    // What do we need to change?
    const changes = diff(
        previousRenderedItems
            .filter(item => !item.hasChanged)
            .concat(newItems)
            .concat(changedItems),
        renderedItems
    );

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

    if (debug) {
        previousVisualFixItem && (previousVisualFixItem.node.style.background = "");
        visualFixItem.node.style.background = "hotpink";
    }

    // Translate & bumper!
    if (offsetFromTop !== previousOffsetFromTop) {
        $slice.style.transform = `translateY(${offsetFromTop}px)`;
    }
    if (totalHeight !== previousTotalHeight) {
        $container.style.height = `${totalHeight}px`;
    }

    // Always set the scrollTop
    $target.scrollTop = scrollTop;

    return {
        $target,
        heightCache,
        content,
        $slice,
        $container,
        viewportHeight,
        renderedItems,
        totalHeight,
        offsetFromTop,
        threshold,
        $activeElement,
        visualFixItem,
        visualFixItemOffset
    };
}

module.exports = render;
