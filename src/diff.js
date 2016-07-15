import makeArrayDiff from "array-diff";

const arrayDiff = makeArrayDiff({
    unique: true,
    compress: true
});

export default function diff(
    left = [],
    right = [],
    getKey = v => v.id
) {
    const keyToV = left.concat(right).reduce(
        (acc, v) => ({
            ...acc,
            [getKey(v)]: v
        }),
        {}
    );
    return arrayDiff(left.map(getKey), right.map(getKey))
        .map(([op, keys]) => [op, keys.map(k => keyToV[k])]);
}
