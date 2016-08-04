const CONTAINER_CLASS = '__container';
const SLICE_CLASS = '__slice';

export function insertAfter($new, $ref) {
    $ref.parentNode.insertBefore($new, $ref.nextSibling);
}

export function getOrCreateElements($target, [$previousContainer, $previousSlice]) {
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

export function calculateHeights(content, $slice, heightCache = {}) {
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

export const opToFn = {
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

export function getBestScrollTop(totalHeight, viewportHeight, targetScrollTop) {
    return Math.min(
        targetScrollTop,
        Math.max(0, totalHeight - viewportHeight)
    );
}
