import test from 'tape';
import { getSlice } from '../slice';

let _id = 0;
function h({
  height = 100,
  hasChanged = false
} = {}) {
  return { id: _id++, height, hasChanged };
}

const list = [
  h(),
  h(),
  h(),
  h({ height: 200 }),
  h()
];

// Basic rendering

test('empty list', t => {
  t.plan(1);
  t.deepEqual(
    getSlice({}, [0, 250], []),
    [0, 0]
  );
});

test('not enough items', t => {
  t.plan(1);
  t.deepEqual(
    getSlice({}, [0, 250], [h()]),
    [0, 0]
  );
});

test('[0,250] => [0,2]', t => {
  t.plan(1);
  t.deepEqual(
    getSlice({}, [0, 250], list),
    [0, 2]
  );
});

test('[50,250] => [0,2]', t => {
  t.plan(1);
  t.deepEqual(
    getSlice({}, [50, 250], list),
    [0, 2]
  );
});

test('[51,250] => [0,3]', t => {
  t.plan(1);
  t.deepEqual(
    getSlice({}, [51, 250], list),
    [0, 3]
  );
});

test('[1000,250] => [3,4]', t => {
  t.plan(1);
  t.deepEqual(
    getSlice({}, [1000, 250], list),
    [3, 4]
  );
});

test('[0,1000] => [0,4]', t => {
  t.plan(1);
  t.deepEqual(
    getSlice({}, [0, 1000], list),
    [0, 4]
  );
});

test('[1000,1000] => [0,4]', t => {
  t.plan(1);
  t.deepEqual(
    getSlice({}, [1000, 1000], list),
    [0, 4]
  );
});

// Buffer

test('[0,250](25) => [0,2]', t => {
  t.plan(1);
  t.deepEqual(
    getSlice({ buffer: 25 }, [0, 250], list),
    [0, 2]
  );
});

test('[0,300] => [0,2]', t => {
  t.plan(1);
  t.deepEqual(
    getSlice({}, [0, 300], list),
    [0, 2]
  );
});

test('[25,250](25) => [0,2]', t => {
  t.plan(1);
  t.deepEqual(
    getSlice({ buffer: 25 }, [25, 250], list),
    [0, 2]
  );
});

test('[-1,301] => [0,3]', t => {
  t.plan(1);
  t.deepEqual(
    getSlice({}, [-1, 301], list),
    [0, 3]
  );
});

test('[25,250](26) => [0,3]', t => {
  t.plan(1);
  t.deepEqual(
    getSlice({ buffer: 26 }, [25, 250], list),
    [0, 3]
  );
});

