import diff from "./diff";

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
    renderedItems: previousRenderedItems,
    totalHeight: previousTotalHeight,
    offsetFromTop: previousOffsetFromTop,
    threshold: previousThreshold,
    $activeElement
}, {
    $target,
    content = [],
    pivot = content[0],
    offset = 0,
    threshold = previousThreshold || 200
}) {
    const [$container, $slice] = getElements($target, [$previousContainer, $previousSlice]);

    // Quick access to item heights
    const getHeight = makeGetHeight(heightCache);

    // Measure the heights
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
    const viewportHeight = previousViewportHeight || $target.clientHeight; // TODO cacheable
    const containerHeight = previousContainerHeight || $container.offsetHeight; // TODO cacheable

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
    const changes = diff(previousRenderedItems || content, renderedItems);

    // How much space do we need to replace at the bottom?
    const offsetFromTop = sum(itemsBeforeStart.map(getHeight));

    // Make the changes!
    //
    // A note on focus handling
    // One of the following things will happen:
    //  - A focused element is removed from the DOM:
    //    We should remember it and try to reapply focus until we have a reason
    //    to think that another node is now the focus target.
    //  - A previously focused element is added back to the DOM
    //  - Another element has been focused since the last render
    if ($activeElement && document.activeElement !== document.body) {
        // Something else got focused, we can forget about restoring focus
        // to our element.
        $activeElement = undefined;
    }
    let blurListener = (e) => {
        $activeElement = e.target;
    };
    $target.addEventListener('blur', blurListener, true);
    let $lastNode;
    changes.forEach(([op, items]) => {
        items.forEach(({ node: $node, id }) => {
            opToFn[op]($slice, $node, $lastNode);
            $lastNode = $node;
        });
    });
    $target.removeEventListener('blur', blurListener, true);

    // If we have an active element and nothing's focused, it's worth trying to
    // refocus as the element might have been added back.
    if ($activeElement && document.activeElement === document.body) {
        $activeElement.focus();
    }
    // Did refocusing work?
    let didRefocus = false;
    if (document.activeElement === $activeElement) {
        didRefocus = true;
        // Refocusing worked, so we can forget our active element
        $activeElement = undefined;
    }

    // Move the scroll position
    if (scrollTop !== previousScrollTop || didRefocus) {
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
        pivot,
        offset,
        scrollTop,
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
