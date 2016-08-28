export function getHeights(list) {
    return list.reduce(
        ([at, ab, sum], { height }) => [
            [...at, sum],
            [...ab, sum + height],
            sum + height
        ],
        [[], [], 0]
    );
}

export function getSlice({
    buffer = 0,
    debug = false
}, [
    scrollTop,
    viewportHeight
], list = []) {
    if (!list.length) {
        return [0,0];
    }

    const [ topOffsets, bottomOffsets, totalHeight ] = getHeights(list);

    debug && console.log({ scrollTop, viewportHeight });

    // Don't scroll off the top or bottom
    const clampedSliceTop = Math.max(
        0,
        Math.min(
            scrollTop,
            totalHeight - viewportHeight
        )
    );
    const clampedSliceBottom = Math.min(
        totalHeight,
        clampedSliceTop + viewportHeight
    );

    // Take the buffer into account for picking the actual value
    const bestSliceTop = Math.max(
        0,
        Math.min(
            clampedSliceTop,
            clampedSliceTop - buffer
        )
    );
    // By the way: this verbosity is unnessary, but it makes the bottom and top
    // values calculated in the same way which ends up easier to follow
    const bestSliceBottom = Math.min(
        totalHeight,
        Math.max(
            clampedSliceBottom,
            clampedSliceBottom + buffer
        )
    );

    debug && console.log({ bestSliceTop, bestSliceBottom });

    const [ candidateStart, candidateEnd ] = [
        list.findIndex((_, i) => bottomOffsets[i] > bestSliceTop),
        list.findIndex((_, i) => bottomOffsets[i] >= bestSliceBottom)
    ];

    return [
        Math.max(candidateStart, 0),
        Math.max(candidateEnd, 0)
    ];
}
