function render({
    container,
    content = [],
    pivot = content[0],
    offset = 0,
    heightCache = {}
}) {    
    // Render content in the container node
    content.forEach(({id, node}) => {
        container.appendChild(node);
        heightCache[id] = node.offsetHeight;
    });

    // Scroll to pivot!
    const pivotIndex = content.indexOf(pivot);
    const nodesBeforePivot = content.slice(0, pivotIndex);
    const spaceBeforePivot = nodesBeforePivot.reduce(
        (sum, { id }) => sum + heightCache[id],
        0
    );

    container.scrollTop = spaceBeforePivot - offset;

    return {
        container,
        heightCache,
        content,
        pivot,
        offset
    };
}

module.exports = render;