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

/**
 * Calculate if an element is visible on the screen.
 * This uses the area of the intersection of the bounding client rectangles
 * of the node and its parents to figure out if it's on screen.
 */
export const isVisible = target => {
    const nodeAndParents = [target, ...parents(target)].filter(isRectAvailable);
    const intersection = nodeAndParents.map(getRect).reduce(intersect);
    return area(intersection) > 0;
};


