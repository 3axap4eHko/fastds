const DEFAULT_CAPACITY = 8;

export interface FilterFunction<T> {
  (value: T, index: number): boolean;
}

export class RingBuffer<T> {
  #buffer: Array<T | undefined>;
  #head = 0;
  #tail = 0;
  #mask: number;
  #length = 0;

  static from<T>(values: T[]): RingBuffer<T> {
    const n = values.length;
    const ring = new RingBuffer<T>(n + 1);
    for (let i = 0; i < n; i++) {
      ring.#buffer[i] = values[i];
    }
    ring.#head = 0;
    ring.#tail = n;
    ring.#length = n;

    return ring;
  }

  readonly [Symbol.toStringTag] = 'RingBuffer';

  constructor(capacity: number = DEFAULT_CAPACITY) {
    const size = Math.max(1 << (32 - Math.clz32(capacity - 1)), DEFAULT_CAPACITY);
    this.#buffer = new Array<T>(size);
    this.#mask = size - 1;
  }

  get capacity() {
    return this.#mask + 1;
  }

  get length() {
    return this.#length;
  }

  isEmpty(): boolean {
    return this.#tail === this.#head;
  }

  isWrapped(): boolean {
    return this.#head > this.#tail;
  }

  getHeadOffset(index: number): number {
    return (this.#head + index) & this.#mask;
  }

  getTailOffset(index: number): number {
    return (this.#tail + index) & this.#mask;
  }

  resize(capacity: number): boolean {
    const buffer = this.#buffer;
    const bufferLength = buffer.length;
    if (bufferLength > capacity && bufferLength >> 1 < capacity) {
      return false;
    }
    const size = Math.max(1 << (32 - Math.clz32(capacity - 1)), DEFAULT_CAPACITY);
    const length = this.#length;
    if (size < length) {
      return false;
    }
    const head = this.#head;
    const prevMask = this.#mask;
    const prevTail = this.#tail;

    const nextMask = size - 1;
    const nextTail = (head + length) & nextMask;

    const wrapIndex = size > bufferLength ? (prevTail < head ? bufferLength - head : length) : nextTail < head ? size - head : length;

    for (let i = length - 1; i >= wrapIndex; i--) {
      const read = (head + i) & prevMask;
      const write = (head + i) & nextMask;
      buffer[write] = buffer[read];
      if (read !== write) {
        buffer[read] = undefined;
      }
    }

    this.#buffer.length = size;
    this.#tail = nextTail;
    this.#mask = nextMask;
    return true;
  }

  grow(capacity: number = this.#mask + 1): void {
    const buffer = this.#buffer;
    const bufferLength = buffer.length;
    if (bufferLength >= capacity + 1) {
      return;
    }
    const size = 1 << (32 - Math.clz32(capacity));
    this.#buffer.length = size;

    const oldTail = this.#tail;
    if (oldTail < this.#head) {
      for (let i = 0; i < oldTail; i++) {
        buffer[bufferLength + i] = buffer[i];
      }
      this.#tail = bufferLength + oldTail;
    }

    this.#mask = size - 1;
  }

  allocate(index: number, count: number): boolean {
    const prevLength = this.#length;
    if (index < 0 || count <= 0) {
      return false;
    }

    index = Math.min(index, prevLength);

    const buffer = this.#buffer;
    const head = this.#head;
    const tail = this.#tail;
    const prevMask = this.#mask;

    const nextLength = count + prevLength;
    const wrapIndex = buffer.length - head;
    const isWrapped = head > tail;

    if (nextLength >= buffer.length) {
      const size = 1 << (32 - Math.clz32(nextLength));
      buffer.length = size;
      this.#mask = size - 1;
    }

    const mask = this.#mask;
    const isResized = prevMask !== mask;

    const leftMoveCount = index;
    const rightMoveCount = prevLength - index;

    if (leftMoveCount < rightMoveCount) {
      if (isResized && isWrapped) {
        for (let i = 0; i < tail; i++) {
          const read = i;
          const write = (head + wrapIndex + i) & mask;
          buffer[write] = buffer[read];
          buffer[read] = undefined;
        }
      }
      const writeBase = (head - count) & mask;
      for (let i = 0; i < leftMoveCount; i++) {
        const read = (head + i) & mask;
        const write = (writeBase + i) & mask;
        buffer[write] = buffer[read];
        buffer[read] = undefined;
      }
      this.#head = writeBase;
    } else {
      if (isResized && isWrapped) {
        for (let i = 0; i < tail; i++) {
          const read = i;
          const write = (head + wrapIndex + i) & mask;
          buffer[write] = buffer[read];
          buffer[read] = undefined;
        }
      }

      for (let i = rightMoveCount - 1; i >= 0; i--) {
        const read = (head + index + i) & mask;
        const write = (head + index + count + i) & mask;

        buffer[write] = buffer[read];
        buffer[read] = undefined;
      }

      this.#tail = (head + nextLength) & mask;
    }

    this.#length = nextLength;
    return true;
  }

  deallocate(index: number, count: number): boolean {
    const prevLength = this.#length;
    if (index < 0 || index >= prevLength || count <= 0) {
      return false;
    }

    const actualCount = Math.min(count, prevLength - index);
    const nextLength = prevLength - actualCount;

    const buffer = this.#buffer;
    const head = this.#head;
    const tail = this.#tail;
    const mask = this.#mask;

    if (index === 0) {
      for (let i = 0; i < actualCount; i++) {
        buffer[(head + i) & mask] = undefined;
      }
      this.#head = (head + actualCount) & mask;
      this.#length = nextLength;
      return true;
    }

    if (index + actualCount === prevLength) {
      for (let i = 0; i < actualCount; i++) {
        buffer[(tail - i - 1) & mask] = undefined;
      }
      this.#tail = (tail - actualCount) & mask;
      this.#length = nextLength;
      return true;
    }

    const leftMoveCount = index;
    const rightMoveCount = prevLength - index - actualCount;

    if (leftMoveCount < rightMoveCount) {
      for (let i = leftMoveCount - 1; i >= 0; i--) {
        const read = (head + i) & mask;
        const write = (head + i + actualCount) & mask;
        buffer[write] = buffer[read];
      }
      for (let i = 0; i < actualCount; i++) {
        buffer[(head + i) & mask] = undefined;
      }
      this.#head = (head + actualCount) & mask;
    } else {
      for (let i = 0; i < rightMoveCount; i++) {
        const read = (head + index + actualCount + i) & mask;
        const write = (head + index + i) & mask;
        buffer[write] = buffer[read];
      }
      this.#tail = (tail - actualCount) & mask;
      for (let i = 0; i < actualCount; i++) {
        buffer[(tail + i) & mask] = undefined;
      }
    }

    this.#length = nextLength;
    return true;
  }

  indexOf(value: T, index: number = 0): number {
    const length = this.#length;
    const buffer = this.#buffer;
    const head = this.#head;
    const tail = this.#tail;

    if (head < tail) {
      const offset = head + index;
      const result = buffer.indexOf(value, offset);
      if (result !== -1 && result < tail) {
        return result - head;
      }
      return -1;
    }
    
    const capacity = buffer.length;
    const firstSegmentLength = capacity - head;

    if (index < firstSegmentLength) {
      const result = buffer.indexOf(value, head + index);
      if (result !== -1) {
        return result - head;
      }
      index = firstSegmentLength;
    }

    if (index < length) {
      const result = buffer.indexOf(value, 0);
      if (result !== -1 && result < tail) {
        return firstSegmentLength + result;
      }
    }
    
    return -1;
  }

  unwrap(): boolean {
    if (this.isEmpty()) {
      return false;
    }
    const length = this.#length;
    const buffer = this.#buffer;
    const prevHead = this.#head;
    const prevTail = this.#tail;

    if (prevHead > prevTail) {
      const bufferLength = buffer.length;
      buffer.length = bufferLength + prevTail;
      for (let i = 0; i < prevTail; i++) {
        buffer[bufferLength + i] = buffer[i];
        buffer[i] = undefined;
      }
    }
    for (let i = 0; i < length; i++) {
      buffer[i] = buffer[prevHead + i];
    }

    buffer.length = this.#mask + 1;
    this.#head = 0;
    this.#tail = length;
    this.#length = length;

    return true;
  }

  compact(filter: FilterFunction<T>): boolean {
    if (this.isEmpty()) {
      return false;
    }
    const length = this.#length;
    const buffer = this.#buffer;
    const head = this.#head;
    const mask = this.#mask;

    let bufferLength = buffer.length;
    let write = 0;
    for (let read = 0; read < length; read++) {
      const readOffset = (head + read) & mask;
      const value = buffer[readOffset]!;
      if (filter(value, read)) {
        if (read !== write) {
          const writeOffset = (head + write) & mask;
          buffer[writeOffset] = value;
        }
        write++;
      }
    }
    if (write === length) {
      return false;
    }
    if (write < bufferLength / 2) {
      const size = 1 << (32 - Math.clz32(write - 1));
      buffer.length = size;
      bufferLength = size;
    }

    for (let i = write; i < bufferLength; i++) {
      buffer[i] = undefined;
    }

    this.#head = 0;
    this.#tail = write;
    this.#length = write;
    return true;
  }

  set(index: number, values: T[], insert = false) {
    const length = this.#length;
    if (index < 0 || index > length) {
      return false;
    }
    const count = values.length;
    if (insert) {
      this.allocate(index, count);
    } else {
      const extra = Math.max(index + values.length - length, 0);
      if (extra > 0) {
        this.allocate(length, extra);
      }
    }
    const buffer = this.#buffer;
    const mask = this.#mask;
    const baseWrite = this.#head + index;
    for (let i = 0; i < count; i++) {
      buffer[(baseWrite + i) & mask] = values[i];
    }
    return true;
  }

  setOne(index: number, value: T, insert = false) {
    const length = this.#length;
    if (index < 0 || index > length) {
      return false;
    }
    if (insert) {
      this.allocate(index, 1);
    } else {
      const extra = Math.max(index + 1 - length, 0);
      if (extra > 0) {
        this.allocate(length, extra);
      }
    }
    const buffer = this.#buffer;
    const mask = this.#mask;
    buffer[(this.#head + index) & mask] = value;

    return true;
  }

  slice(start: number = 0, end: number = this.#length): T[] {
    const length = this.#length;
    const buffer = this.#buffer;
    const head = this.#head;
    const tail = this.#tail;
    const mask = this.#mask;

    const actualStart = start < 0 ? Math.max(length + start, 0) : Math.min(start, length);
    const actualEnd = end < 0 ? Math.max(length + end, 0) : Math.min(end, length);

    if (head <= tail) {
      return this.#buffer.slice((head + actualStart) & mask, (head + actualEnd) & mask) as T[];
    }

    const size = Math.max(actualEnd - actualStart, 0);
    const result = new Array<T>(size);
    for (let i = 0; i < size; i++) {
      result[i] = buffer[(head + actualStart + i) & mask]!;
    }
    return result;
  }

  removeOne(index: number): number {
    const length = this.#length;
    if (index < 0 || index >= length) {
      return -1;
    }
    const buffer = this.#buffer;
    const mask = this.#mask;
    const head = this.#head;

    const leftMoveCount = index;
    const rightMoveCount = length - index;

    if (leftMoveCount < rightMoveCount) {
      for (let i = index; i > 0; i--) {
        buffer[(head + i) & mask] = buffer[(head + i - 1) & mask];
      }
      buffer[head] = undefined;
      this.#head = (head + 1) & mask;
    } else {
      for (let i = index; i < length - 1; i++) {
        buffer[(head + i) & mask] = buffer[(head + i + 1) & mask];
      }
      const tail = (head + length - 1) & mask;
      buffer[tail] = undefined;
      this.#tail = tail;
    }
    this.#length = length - 1;

    return index;
  }

  removeFirst(value: T, index: number = 0): number {
    const foundIndex = this.indexOf(value, index);
    if (foundIndex === -1) {
      return -1;
    }
    return this.removeOne(foundIndex);
  }

  remove(index: number, count: number): T[] {
    const result = this.slice(index, index + count);
    this.deallocate(index, count);
    return result;
  }

  push(value: T) {
    const nextTail = (this.#tail + 1) & this.#mask;
    if (nextTail === this.#head) {
      this.grow(this.#mask + 2);
      this.#buffer[this.#tail] = value;
      this.#tail = (this.#tail + 1) & this.#mask;
    } else {
      this.#buffer[this.#tail] = value;
      this.#tail = nextTail;
    }
    this.#length++;
    return this;
  }

  unshift(value: T): this {
    const newHead = (this.#head - 1) & this.#mask;
    if (newHead === this.#tail) {
      this.grow(this.#mask + 2);
      this.#head = (this.#head - 1) & this.#mask;
    } else {
      this.#head = newHead;
    }
    this.#buffer[this.#head] = value;
    this.#length++;
    return this;
  }

  shift(): T | undefined {
    if (this.#head === this.#tail) {
      return undefined;
    }
    const value = this.#buffer[this.#head];
    this.#buffer[this.#head] = undefined;
    this.#head = (this.#head + 1) & this.#mask;
    this.#length--;
    return value;
  }

  pop(): T | undefined {
    if (this.#head === this.#tail) {
      return undefined;
    }
    this.#tail = (this.#tail - 1) & this.#mask;
    const value = this.#buffer[this.#tail];
    this.#buffer[this.#tail] = undefined;
    this.#length--;
    return value;
  }

  peekAt(index: number): T | undefined {
    if (index < 0 || index >= this.#length) {
      return undefined;
    }
    const offset = this.getHeadOffset(index);
    return this.#buffer[offset];
  }

  peekFirst(): T | undefined {
    return this.#buffer[this.#head];
  }

  peekLast(): T | undefined {
    const offset = this.getTailOffset(-1);
    return this.#buffer[offset];
  }

  has(value: T): boolean {
    return this.indexOf(value) !== -1;
  }

  clear(): this {
    this.#buffer.length = 0;
    this.#buffer.length = DEFAULT_CAPACITY;
    this.#head = 0;
    this.#tail = 0;
    this.#length = 0;
    this.#mask = DEFAULT_CAPACITY - 1;
    return this;
  }

  toArray(): T[] {
    return this.slice();
  }

  drain(): IteratorObject<T, void, unknown> {
    return Iterator.from({
      [Symbol.iterator]: () => {
        return {
          next: (): IteratorResult<T> => {
            if (this.#length === 0) {
              return { done: true, value: undefined };
            }
            const value = this.shift()!;
            return { done: false, value };
          },
        };
      },
    });
  }

  iter(): IteratorObject<T, void, unknown> {
    return Iterator.from(this[Symbol.iterator]());
  }

  [Symbol.iterator](): Iterator<T, void, unknown> {
    const buffer = this.#buffer;
    const mask = this.#mask;
    const length = this.#length;
    let count = 0;
    let idx = this.#head;
    return {
      next: (): IteratorResult<T> => {
        if (count >= length) {
          return { done: true, value: undefined };
        }
        const value = buffer[idx]!;
        idx = (idx + 1) & mask;
        count++;
        return { done: false, value };
      },
    };
  }
}
