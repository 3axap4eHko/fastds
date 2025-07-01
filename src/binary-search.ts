import { RingBuffer } from './ring-buffer.js';

export interface Comparator<T> {
  (a: T, b: T): number;
}

export class BinarySearchArray<T> implements Iterable<T, void, unknown> {
  #buffer: RingBuffer<T>;
  #comparator: Comparator<T>;

  constructor(comparator: Comparator<T>) {
    this.#buffer = new RingBuffer();
    this.#comparator = comparator;
  }

  readonly [Symbol.toStringTag] = 'BinarySearchArray';

  get length(): number {
    return this.#buffer.length;
  }

  at(index: number) {
    return this.#buffer.peekAt(index);
  }

  lowerBound(value: T): number {
    const length = this.#buffer.length;
    if (length === 0) return 0;

    let left = 0;
    let right = length;

    while (left < right) {
      const mid = (left + right) >>> 1;
      if (this.#comparator(this.#buffer.peekAt(mid)!, value) < 0) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    return left;
  }

  upperBound(value: T): number {
    const length = this.#buffer.length;
    if (length === 0) return 0;

    let left = 0;
    let right = length;

    while (left < right) {
      const mid = (left + right) >>> 1;
      if (this.#comparator(this.#buffer.peekAt(mid)!, value) <= 0) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    return left;
  }

  indexOf(value: T, index = 0) {
    const length = this.#buffer.length;
    if (length === 0 || index >= length) return -1;

    let left = index;
    let right = length - 1;

    while (left <= right) {
      const mid = (left + right) >>> 1;
      const cmp = this.#comparator(this.#buffer.peekAt(mid)!, value);

      if (cmp === 0) {
        return mid;
      } else if (cmp < 0) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    return -1;
  }

  has(value: T): boolean {
    return this.indexOf(value) !== -1;
  }

  insert(value: T) {
    const index = this.lowerBound(value);
    this.#buffer.setOne(index, value, true);

    return index;
  }

  removeOne(index: number) {
    return this.#buffer.removeOne(index);
  }

  removeFirst(value: T) {
    const index = this.indexOf(value);
    return this.#buffer.removeOne(index);
  }

  remove(index: number, count: number): this {
    this.#buffer.deallocate(index, count);

    return this;
  }

  iter() {
    return this.#buffer.iter();
  }

  [Symbol.iterator](): Iterator<T> {
    return this.#buffer[Symbol.iterator]();
  }
}
