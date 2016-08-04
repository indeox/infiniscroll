import iff from "if-expression";
import diff from "./diff";
import restoreFocus from "./restoreFocus";
import { sum, leftSums } from "./sumUtils";
import {
    insertAfter,
    opToFn,
    calculateHeights,
    getOrCreateElements,
    getBestScrollTop
} from "./domUtils";

module.exports = function render({
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
    visualFixItemOffset: previousVisualFixItemOffset,
    pivotItem: previousPivotItem
}, {
    $target,
    content = [],
    pivotItem,
    pivotOffset = 0,
    threshold = previousThreshold || 200,
    proximityThreshold = 3,
    onBottomProximity = () => {},
    onScroll = () => {},
    debug = false
}) {
    const [
        $container,
        $slice
    ] = getOrCreateElements($target, [$previousContainer, $previousSlice]);

    // Viewport height should be use clientHeight to avoid a measurement that includes
    // the border, as this will throw off the calculation below;
    const viewportHeight = previousViewportHeight || $target.clientHeight;
    const viewportScrollTop = $target.scrollTop;

    // Measure the heights and track new items
    const [
        totalHeight,
        heightCache,
        newItems,
        changedItems
    ] = calculateHeights(content, $slice, previousHeightCache);

    // Quick access to item heights
    const getHeight = ({ id }) => heightCache[id];
    const heightSums = leftSums(content.map(getHeight));

    // Should we restore focus around a particular element?
    const [fixItem, fixItemOffset] = iff(
        // If supplied we should lock onto the pivot
        pivotItem,
        () => [pivotItem, pivotOffset + getHeight(pivotItem)],
        // If something changed then we might need to lock onto a previous item
        (changedItems.length || newItems.length) && previousVisualFixItem,
        () => [previousVisualFixItem, previousVisualFixItemOffset],
        // Nothing to lock on to
        () => []
    );

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
        () => viewportScrollTop
    );

    // Don't over-scroll
    const scrollTop = getBestScrollTop(
        totalHeight,
        viewportHeight,
        // Rounding here fixes scroll offset rounding errors
        Math.round(targetScrollPosition)
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
            // TODO if this were an immutable list, would this work?
            .filter(item => !item.hasChanged)
            .concat(newItems)
            .concat(changedItems),
        renderedItems
    );

    // How much space do we need to replace at the top?
    const offsetFromTop = heightSums[itemsBeforeStart.length - 1] || 0;

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
        previousPivotItem && (previousPivotItem.node.style.background = "");
        pivotItem && (pivotItem.node.style.background = "honeydew");
    }

    // Translate & container modifications
    if (offsetFromTop !== previousOffsetFromTop) {
        $slice.style.transform = `translateY(${offsetFromTop}px)`;
    }
    if (totalHeight !== previousTotalHeight) {
        $container.style.height = `${totalHeight}px`;
    }

    // Always set the scrollTop
    $target.scrollTop = scrollTop;

    // Interaction callbacks
    onScroll({
        scrollTop: offsetFromTop + scrollTop
    });

    if (content.length - visualFixItemIndex <= proximityThreshold) {
        onBottomProximity();
    }

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
        visualFixItemOffset,
        pivotItem
    };
}
