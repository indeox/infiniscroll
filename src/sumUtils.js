export function sum(arr) {
    return arr.reduce((a, b) => a + b, 0);
}

export function leftSums(arr) {
    return arr.reduce(
        ({ total, acc }, v) => ({ total: total + v, acc: [...acc, total + v] }),
        { total: 0, acc: [] }
    ).acc;
}

