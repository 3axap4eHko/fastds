import { describe, it, expect } from 'vitest';
import { RingBuffer } from '../ring-buffer.js';

const range = (length: number) => Array.from({ length }, (_, idx) => idx + 1);
const matrix = (...lengths: number[]): number[][] => {
  if (lengths.length === 0) return [];
  if (lengths.length === 1) return range(lengths[0]).map((x) => [x]);

  const [first, ...rest] = lengths;
  const restMatrix = matrix(...rest);

  return range(first).flatMap((i) => restMatrix.map((subArray) => [i, ...subArray]));
};

const wrapRing = <T>(ring: RingBuffer<T>, tail = ring.length / 2) => {
  if (tail === 0) {
    return;
  }
  const data = ring.toArray();
  ring.clear();

  const shift = (ring.capacity - (tail & (ring.capacity - 1))) % ring.capacity;
  for (let i = 0; i < shift; i++) {
    ring.push(undefined as T);
    ring.shift();
  }
  for (let i = 0; i < data.length; i++) {
    ring.push(data[i]);
  }
};

describe('Ring test suite', () => {
  it('should be empty by default', () => {
    const q = new RingBuffer();
    expect(q.isEmpty()).toBe(true);
    expect(q.isWrapped()).toBe(false);
    expect(q.length).toBe(0);
    expect(q.peekFirst()).toBeUndefined();
    expect(q.peekLast()).toBeUndefined();
    expect(q.peekAt(0)).toBeUndefined();
    expect(q.shift()).toBeUndefined();
    expect(q.pop()).toBeUndefined();
    expect(`${q}`).toContain(RingBuffer.name);
  });

  it('should be initializable with initial values', () => {
    const q = RingBuffer.from(range(3));
    expect(q.isEmpty()).toBe(false);
    expect(q.isWrapped()).toBe(false);
    expect(q.length).toBe(3);
    expect(q.peekFirst()).toBe(1);
    expect(q.peekLast()).toBe(3);
    expect(q.peekAt(0)).toBe(1);
    expect(q.peekAt(1)).toBe(2);
    expect(q.peekAt(2)).toBe(3);
    expect([...q]).toEqual([1, 2, 3]);
  });

  it('should be initializable with initial values and increased capacity', () => {
    const q = RingBuffer.from(range(8));
    expect(q.capacity).toBe(16);
  });

  it('should clear values', () => {
    const q = RingBuffer.from(range(3));
    q.clear();
    expect(q.isEmpty()).toBe(true);
    expect(q.length).toBe(0);
    expect(q.peekFirst()).toBeUndefined();
    expect(q.peekLast()).toBeUndefined();
    expect(q.peekAt(0)).toBeUndefined();
    expect(q.shift()).toBeUndefined();
    expect(q.pop()).toBeUndefined();
  });

  describe('enqueue/dequeue', () => {
    it('should push elements to the end and shift from the start', () => {
      const q = RingBuffer.from(range(1));
      q.push(2);
      expect(q.shift()).toEqual(1);
      q.push(3);
      expect(q.shift()).toEqual(2);
      expect(q.shift()).toEqual(3);
    });
    it('should unshift elements to the start and pop from the end', () => {
      const q = RingBuffer.from([3]);
      q.unshift(2);
      expect(q.pop()).toEqual(3);
      q.unshift(1);
      expect(q.pop()).toEqual(2);
      expect(q.pop()).toEqual(1);
    });
  });

  describe('resize', () => {
    it.each([
      { count: 5, wrap: 0, resize: 8, expected: 8, shouldResize: true },
      { count: 5, wrap: 2, resize: 12, expected: 16, shouldResize: true },
      { count: 3, wrap: 0, resize: 6, expected: 8, shouldResize: false },
      { count: 2, wrap: 0, resize: 15, expected: 16, shouldResize: true },
      { count: 6, wrap: 1, resize: 10, expected: 16, shouldResize: true },
      { count: 8, wrap: 0, resize: 10, expected: 16, shouldResize: false },
      { count: 16, wrap: 0, resize: 1, expected: 32, shouldResize: false },
      { count: 4, wrap: 0, resize: 4, expected: 8, shouldResize: true },
      { count: 17, wrap: 0, resize: 10, expected: 32, shouldResize: false },
    ])('should resize array with $count elements ($wrap wrap) to capacity $resize', ({ count, wrap, resize, expected, shouldResize }) => {
      const array = range(count);
      const q = RingBuffer.from(array);
      wrapRing(q, wrap);
      expect(q.isWrapped()).toBe(!!wrap);
      expect(q.resize(resize)).toBe(shouldResize);
      expect(q.capacity).toBe(expected);
      expect(q.toArray()).toEqual(array);
    });

    it('should not resize if new capacity is smaller than length', () => {
      const q = RingBuffer.from(range(10));
      expect(q.resize(4)).toBe(false);
      expect(q.capacity).toBe(16);
    });

    it('should not resize if new capacity is smaller than length', () => {
      const q = RingBuffer.from(range(9));
      expect(q.resize(7)).toBe(false);
      expect(q.capacity).toBe(16);
    });

    it('should not resize if capacity is not changing much', () => {
      const q = RingBuffer.from(range(5));
      expect(q.resize(6)).toBe(false);
      expect(q.capacity).toBe(8);
    });

    it('should shrink a wrapped buffer', () => {
      const q = new RingBuffer<number>(16);
      const data = range(7);
      for (const v of data) {
        q.push(v);
      }
      expect(q.capacity).toBe(16);

      wrapRing(q, 4);
      const finalData = q.toArray();
      expect(q.isWrapped()).toBe(true);
      expect(finalData).toEqual(data);

      expect(q.resize(8)).toBe(true);
      expect(q.capacity).toBe(8);
      expect(q.length).toBe(7);
      expect(q.toArray()).toEqual(finalData);
    });
  });
});

describe('grow', () => {
  it('should not grow capacity if has space', () => {
    const array = range(6);
    const q = RingBuffer.from(array);
    expect(q.capacity).toBe(8);
    q.grow(7);
    expect(q.capacity).toBe(8);
  });

  it('should grow capacity if no space', () => {
    const array = range(7);
    const q = RingBuffer.from(array);
    expect(q.capacity).toBe(8);
    q.grow();
    expect(q.capacity).toBe(16);
  });

  it('should grow custom capacity if no space', () => {
    const array = range(6);
    const q = RingBuffer.from(array);
    expect(q.capacity).toBe(8);
    q.grow(8);
    expect(q.capacity).toBe(16);
  });

  it('should grow wrapped capacity', () => {
    const array = range(7);
    const q = RingBuffer.from(array);
    q.shift();
    q.shift();
    q.push(1).push(2);
    expect(q.isWrapped()).toBe(true);
    expect(q.capacity).toBe(8);
    q.grow();
    expect(q.capacity).toBe(16);
  });

  it('should not unwrap empty', () => {
    const q = new RingBuffer();
    expect(q.isWrapped()).toBe(false);
    expect(q.unwrap()).toBe(false);
  });

  it('should unwrap', () => {
    const array = range(7);
    const q = RingBuffer.from(array);
    expect(q.isWrapped()).toBe(false);
    expect(q.toArray()).toEqual(array);
    wrapRing(q);
    expect(q.isWrapped()).toBe(true);
    expect(q.toArray()).toEqual(array);
    expect(q.unwrap()).toBe(true);
    expect(q.isWrapped()).toBe(false);
    expect(q.toArray()).toEqual(array);
  });

  it('should trigger grow capacity on push', () => {
    const array = range(7);
    const q = RingBuffer.from(array);
    expect(q.capacity).toBe(8);
    q.push(0);
    expect(q.capacity).toBe(16);
  });

  it('should trigger grow capacity on unshift', () => {
    const array = range(7);
    const q = RingBuffer.from(array);
    expect(q.capacity).toBe(8);
    q.unshift(0);
    expect(q.capacity).toBe(16);
  });

  it('should maintain data integrity when growing wrapped buffer', () => {
    const q = RingBuffer.from(range(7));
    wrapRing(q, 2);
    q.grow(16);
    expect(q.capacity).toBe(32);
    expect(q.toArray()).toEqual(range(7));
  });
});

it('should yield correct order when iterating', () => {
  const q = RingBuffer.from(range(3));
  expect(q.shift()).toBe(1);
  q.push(4).push(5).push(6);
  const result = [...q];
  expect(result).toEqual([2, 3, 4, 5, 6]);
});

it('should empty the queue when draining with drain()', () => {
  const q = new RingBuffer();
  q.push(10).push(20);
  const drained = Array.from(q.drain());
  expect(drained).toEqual([10, 20]);
  expect(q.isEmpty()).toBe(true);
});

it('should detect presence and absence of values with has()', () => {
  const q = new RingBuffer();
  q.push('x').push('y');
  expect(q.has('x')).toBe(true);
  expect(q.has('z')).toBe(false);
});

it('should show next element without removing it using peek()', () => {
  const q = new RingBuffer();
  q.push('first').push('second');
  expect(q.peekFirst()).toBe('first');
  expect(q.length).toBe(2);
  expect(q.shift()).toBe('first');
  expect(q.peekFirst()).toBe('second');
});

describe('compact', () => {
  it('should return false when compact is called on empty queue', () => {
    const q = new RingBuffer();
    const removed = q.compact((n) => !!n);
    expect(removed).toBe(false);
  });

  it("should return false when compact didn't filter anything", () => {
    const q = RingBuffer.from(range(5));
    const removed = q.compact(() => true);
    expect(removed).toBe(false);
  });

  it('should return true when compact removed some values', () => {
    const q = RingBuffer.from(range(5));
    const removed = q.compact(() => false);
    expect(removed).toBe(true);
  });

  it('should remove elements based on filter when compact is called', () => {
    const q = new RingBuffer<number>();
    q.push(1).push(2).push(3).push(4);
    const removed = q.compact((n) => n % 2 === 0);
    expect(removed).toBe(true);
    const remaining = Array.from(q);
    expect(remaining).toEqual([2, 4]);
  });
});

it.each([[], [3, 7], [-1], [0, -1]])('should slice the queue', (...args) => {
  const q = RingBuffer.from(range(10));
  expect(q.slice(...args)).toEqual(range(10).slice(...args));
});

describe('allocate', () => {
  it('should reject invalid parameters', () => {
    const q = RingBuffer.from([1, 2, 3]);
    expect(q.allocate(-1, 1)).toBe(false);
    expect(q.allocate(0, 0)).toBe(false);
    expect(q.allocate(0, -1)).toBe(false);
  });

  const length = 5;
  it.each(
    matrix(length, length + 2, length).map(([wrapSize, value, count]) => {
      const index = value - 1;
      const result: unknown[] = range(length);
      result.splice(index, 0, ...Array.from({ length: count }));
      return { index, count, length, wrapSize, result };
    }),
  )('should allocate in $wrapSize wrapped buffer $count elements at index $index to have $result', ({ index, count, length, wrapSize, result }) => {
    const q = RingBuffer.from(range(length));
    wrapRing(q, wrapSize);
    expect(q.isWrapped()).toBe(wrapSize > 0);
    q.allocate(index, count);
    expect(q.toArray()).toEqual(result);
  });
});

describe('deallocate', () => {
  const length = 5;
  it.each(
    matrix(length, length + 2, length).map(([wrapSize, value, count]) => {
      const index = value - 1;
      const result: unknown[] = range(length);
      result.splice(index, count);
      return { index, count, length, wrapSize, result };
    }),
  )('should deallocate in $wrapSize wrapped buffer $count elements at index $index to have $result', ({ index, count, length, wrapSize, result }) => {
    const q = RingBuffer.from(range(length));
    wrapRing(q, wrapSize);
    expect(q.isWrapped()).toBe(wrapSize > 0);
    q.deallocate(index, count);
    expect(q.toArray()).toEqual(result);
  });
});

describe('removeOne', () => {
  it('should return -1 if index is outside of the range', () => {
    const q = new RingBuffer();
    expect(q.removeOne(1)).toBe(-1);
  });
  it.each([
    { n: 'first', length: 7, index: 0 },
    { n: 'mid', length: 7, index: 3 },
    { n: 'mid', length: 7, index: 4 },
    { n: 'last', length: 7, index: 6 },
  ])('should remove $n element', ({ length, index }) => {
    const data = range(length);
    const result = [...data];
    const q = RingBuffer.from(data);
    q.removeOne(index);
    result.splice(index, 1);
    expect(q.toArray()).toEqual(result);
  });

  it.each([
    { n: 'first', length: 7, index: 0 },
    { n: 'mid', length: 7, index: 3 },
    { n: 'mid', length: 7, index: 4 },
    { n: 'last', length: 7, index: 6 },
  ])('should remove wrapped $n element', ({ length, index }) => {
    const data = range(length);
    const result = [...data];
    const q = RingBuffer.from(data);
    wrapRing(q);
    q.removeOne(index);
    result.splice(index, 1);
    expect(q.toArray()).toEqual(result);
  });
});
it('should convert to array', () => {
  const q = RingBuffer.from(range(10));
  expect(q.toArray()).toEqual(range(10));
});

it('should create iterator object', () => {
  const q = RingBuffer.from(range(10));
  const iterator = q.iter();
  expect(iterator.next()).toEqual({ done: false, value: 1 });
});

describe('removeFirst', () => {
  it('should return -1 when value not found', () => {
    const q = RingBuffer.from([1, 2, 3]);
    expect(q.removeFirst(5)).toBe(-1);
  });

  it('should remove first occurrence of value', () => {
    const q = RingBuffer.from([1, 2, 3, 2, 4]);
    expect(q.removeFirst(2)).toBe(1);
    expect(q.toArray()).toEqual([1, 3, 2, 4]);
  });

  it('should remove first occurrence starting from index', () => {
    const q = RingBuffer.from([1, 2, 3, 2, 4]);
    expect(q.removeFirst(2, 2)).toBe(3);
    expect(q.toArray()).toEqual([1, 2, 3, 4]);
  });
});

describe('remove', () => {
  it('should remove elements by range', () => {
    const q = RingBuffer.from([1, 2, 3, 4, 5]);
    const removed = q.remove(1, 2);
    expect(removed).toEqual([2, 3]);
    expect(q.toArray()).toEqual([1, 4, 5]);
  });

  it('should remove elements from wrapped buffer', () => {
    const q = RingBuffer.from([1, 2, 3, 4, 5]);
    wrapRing(q, 2);
    const removed = q.remove(1, 2);
    expect(removed).toEqual([2, 3]);
    expect(q.toArray()).toEqual([1, 4, 5]);
  });
});

describe('set', () => {
  it('should reject invalid indices', () => {
    const q = RingBuffer.from([1, 2, 3]);
    expect(q.set(-1, [99])).toBe(false);
    expect(q.set(4, [99])).toBe(false);
  });

  it('should insert values at specified position', () => {
    const q = RingBuffer.from([1, 2, 3]);
    expect(q.set(1, [88, 99], true)).toBe(true);
    expect(q.toArray()).toEqual([1, 88, 99, 2, 3]);
  });

  it('should extend buffer when setting beyond current length', () => {
    const q = RingBuffer.from([1, 2, 3]);
    expect(q.set(2, [88, 99, 77])).toBe(true);
    expect(q.toArray()).toEqual([1, 2, 88, 99, 77]);
  });
});

describe('setOne', () => {
  it('should reject invalid indices', () => {
    const q = RingBuffer.from([1, 2, 3]);
    expect(q.setOne(-1, 99)).toBe(false);
    expect(q.setOne(4, 99)).toBe(false);
  });

  it('should insert single value at specified position', () => {
    const q = RingBuffer.from([1, 2, 3]);
    expect(q.setOne(1, 99, true)).toBe(true);
    expect(q.toArray()).toEqual([1, 99, 2, 3]);
  });

  it('should extend buffer when setting at boundary', () => {
    const q = RingBuffer.from([1, 2]);
    expect(q.setOne(2, 99)).toBe(true);
    expect(q.toArray()).toEqual([1, 2, 99]);
  });
});

describe('indexOf', () => {
  const length = 5;
  it.each(
    matrix(length, length, length + 2).map(([wrapSize, index, value]) => ({
      wrapSize,
      index: index - 1,
      value,
      input: range(2).flatMap(() => range(length)),
    })),
  )('should find index of $value starting from index $index in $input', ({ wrapSize, index, value, input }) => {
    const q = RingBuffer.from(input);
    wrapRing(q, wrapSize);
    expect(q.toArray()).toEqual(input);
    expect(q.indexOf(value, index)).toBe(input.indexOf(value, index));
  });

  it('should find values in wrapped buffer', () => {
    const q = RingBuffer.from([1, 2, 3, 4, 5]);
    wrapRing(q, 2);
    expect(q.indexOf(4, 0)).toBe(3);
    expect(q.indexOf(1, 4)).toBe(-1);
  });

  it('should find values after buffer wrapping', () => {
    const q = RingBuffer.from([1, 2, 3, 4, 5, 6, 7]);
    wrapRing(q, 2);
    expect(q.indexOf(1, 0)).toBe(0);
  });

  it('should find value in wrapped part of the buffer', () => {
    const q = RingBuffer.from([1, 2, 3, 4, 5, 6, 7]);
    wrapRing(q, 5);
    expect(q.isWrapped()).toBe(true);
    expect(q.length).toBe(7);
    expect(q.toArray()).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(q.indexOf(7)).toBe(6);
  });
});
