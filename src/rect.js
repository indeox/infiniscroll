export const area = ({ top, right, bottom, left }) =>
    Math.max(
        Math.max(bottom - top, 0) * Math.max(right - left, 0),
        0
    );

export const intersect = (a, b) => ({
    top: Math.max(a.top, b.top),
    left: Math.max(a.left, b.left),
    right: Math.max(Math.min(a.right, b.right), 0),
    bottom: Math.max(Math.min(a.bottom, b.bottom), 0)
});

export const getRect = node => node.getBoundingClientRect();

export const isRectAvailable = node =>
    (typeof node.getBoundingClientRect === 'function');

export const parents = node =>
    (node.parentNode ?
        [node.parentNode].concat(parents(node.parentNode)) :
        []);

export const isCSSVisible = node => {
    const { display, visibility } = window.getComputedStyle(node);
    return (display !== 'none' && visibility !== 'hidden');
};

/**
 * Calculate if an element is visible on the screen.
 * This uses the area of the intersection of the bounding client rectangles
 * of the node and its parents to figure out if it's on screen.
 */
export const isVisible = target => {
    // Walk up the DOM to find all the nodes that might affect visibility
    const nodeAndParents = [target, ...parents(target)].filter(isRectAvailable);
    // Using Array#every should be efficient becuase it will exit early
    const allAreCSSVisible = nodeAndParents.every(isCSSVisible);
    if (!allAreCSSVisible) return false;
    // The reduce is seeded by the first value automatically, and can happen
    // in any order
    const intersection = nodeAndParents.map(getRect).reduce(intersect);
    // The *area* of the intersection is the important bit. If there's even one
    // pixel visible, this will be true.
    return area(intersection) > 0;
};


