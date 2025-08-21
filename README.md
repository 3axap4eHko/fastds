# FastDS

[![Github Build Status][github-image]][github-url]
[![NPM version][npm-image]][npm-url]
[![Downloads][downloads-image]][npm-url]
[![Coverage Status][codecov-image]][codecov-url]
[![Snyk][snyk-image]][snyk-url]

Fast, zero-dependency TypeScript data structures optimized for high-performance applications.

## Features

- **🚀 High Performance** - Up to 37% faster than popular alternatives
- **🔄 O(1) Operations** - Constant time push, pop, shift, unshift operations
- **📦 Zero Dependencies** - No external runtime dependencies
- **🔍 TypeScript Native** - Full type safety and IntelliSense support
- **💾 Memory Efficient** - Smart memory management with automatic cleanup
- **🎯 Production Ready** - Battle-tested with 100% test coverage

## Installation

```bash
npm install fastds
# or
yarn add fastds
# or
pnpm add fastds
```

## Quick Start

```typescript
import { RingBuffer, BinarySearchArray } from 'fastds';

// Create a high-performance circular buffer
const buffer = new RingBuffer<number>();
buffer.push(1).push(2).push(3);
console.log(buffer.shift()); // 1
console.log(buffer.pop());   // 3

// Create a sorted array with binary search
const sorted = new BinarySearchArray<number>((a, b) => a - b);
sorted.insert(5);
sorted.insert(2);
sorted.insert(8);
console.log(sorted.indexOf(5)); // 1 (sorted: [2, 5, 8])
```

## Data Structures

### RingBuffer

A high-performance circular buffer (double-ended queue) with O(1) operations for both ends.

#### Why Use RingBuffer?

- **Queue/Deque Operations**: Perfect for FIFO/LIFO operations, message queues, and task scheduling
- **Sliding Windows**: Efficient for implementing sliding window algorithms
- **Stream Buffers**: Ideal for I/O operations, network buffers, and data streaming
- **Performance Critical**: When you need faster operations than JavaScript's native Array

#### Basic Usage

```typescript
import { RingBuffer } from 'fastds';

// Create with optional initial capacity
const buffer = new RingBuffer<string>(100);

// Add elements
buffer.push('world');     // Add to end
buffer.unshift('hello');  // Add to beginning

// Remove elements
const first = buffer.shift(); // Remove from beginning: 'hello'
const last = buffer.pop();     // Remove from end: 'world'

// Peek without removing
buffer.push('a', 'b', 'c');
console.log(buffer.peekFirst()); // 'a'
console.log(buffer.peekLast());  // 'c'
console.log(buffer.peekAt(1));   // 'b'
```

#### Advanced Operations

```typescript
// Create from array
const numbers = RingBuffer.from([1, 2, 3, 4, 5]);

// Array-like operations
numbers.slice(1, 3);        // [2, 3]
numbers.indexOf(3);         // 2
numbers.has(4);            // true
numbers.toArray();         // [1, 2, 3, 4, 5]

// Modify at index
numbers.setOne(2, 10);     // Replace index 2 with 10
numbers.setOne(2, 20, true); // Insert 20 at index 2

// Remove elements
numbers.removeOne(1);      // Remove element at index 1
numbers.removeFirst(10);   // Remove first occurrence of 10
numbers.remove(0, 2);      // Remove 2 elements starting at index 0

// Iteration
for (const value of numbers) {
  console.log(value);
}

// Drain iterator (removes elements while iterating)
const drainIter = numbers.drain();
for (const value of drainIter) {
  console.log(value); // Buffer becomes empty after iteration
}
```

#### Memory Management

```typescript
const buffer = new RingBuffer<object>(1000);

// Add many elements
for (let i = 0; i < 10000; i++) {
  buffer.push({ data: i });
}

// Compact: remove gaps and optimize memory
buffer.compact((item) => item.data % 2 === 0); // Keep only even numbers

// Resize: adjust capacity
buffer.resize(500); // Shrink if possible

// Clear: remove all elements and reset
buffer.clear();
```

### BinarySearchArray

A sorted array with O(log n) search operations using binary search algorithms.

#### Why Use BinarySearchArray?

- **Sorted Collections**: Maintains elements in sorted order automatically
- **Fast Lookups**: O(log n) search performance for large datasets
- **Range Queries**: Efficiently find elements within a range
- **Priority Systems**: Implement priority queues and ordered lists

#### Basic Usage

```typescript
import { BinarySearchArray } from 'fastds';

// Create with a comparator function
const numbers = new BinarySearchArray<number>((a, b) => a - b);

// Elements are automatically sorted on insertion
numbers.insert(5);  // [5]
numbers.insert(2);  // [2, 5]
numbers.insert(8);  // [2, 5, 8]
numbers.insert(5);  // [2, 5, 5, 8] - duplicates allowed

// Binary search operations
console.log(numbers.indexOf(5));  // 1 - first occurrence
console.log(numbers.has(8));      // true
```

#### Advanced Search Operations

```typescript
// Custom object sorting
interface Task {
  priority: number;
  name: string;
}

const tasks = new BinarySearchArray<Task>(
  (a, b) => a.priority - b.priority
);

tasks.insert({ priority: 3, name: 'Medium task' });
tasks.insert({ priority: 1, name: 'High priority' });
tasks.insert({ priority: 5, name: 'Low priority' });

// Access sorted elements
console.log(tasks.at(0)); // { priority: 1, name: 'High priority' }

// Find insertion points
const newTask = { priority: 2, name: 'New task' };
const lowerBound = tasks.lowerBound(newTask); // First position >= 2
const upperBound = tasks.upperBound(newTask); // First position > 2

// Remove elements
tasks.removeFirst(newTask);  // Remove first matching element
tasks.removeOne(0);          // Remove at index
tasks.remove(0, 2);          // Remove range

// Iteration (in sorted order)
for (const task of tasks) {
  console.log(task.name);
}
```

## Real-World Use Cases

### Message Queue System

```typescript
class MessageQueue<T> {
  private buffer = new RingBuffer<T>(1000);
  
  enqueue(message: T): void {
    if (this.buffer.length >= this.buffer.capacity) {
      this.buffer.shift(); // Remove oldest if full
    }
    this.buffer.push(message);
  }
  
  dequeue(): T | undefined {
    return this.buffer.shift();
  }
  
  peek(): T | undefined {
    return this.buffer.peekFirst();
  }
  
  size(): number {
    return this.buffer.length;
  }
}
```

### Sliding Window Rate Limiter

```typescript
class RateLimiter {
  private timestamps: RingBuffer<number>;
  private windowMs: number;
  private maxRequests: number;
  
  constructor(maxRequests: number, windowMs: number) {
    this.timestamps = new RingBuffer<number>(maxRequests);
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }
  
  tryRequest(): boolean {
    const now = Date.now();
    const cutoff = now - this.windowMs;
    
    // Remove old timestamps outside the window
    while (!this.timestamps.isEmpty() && 
           this.timestamps.peekFirst()! < cutoff) {
      this.timestamps.shift();
    }
    
    if (this.timestamps.length < this.maxRequests) {
      this.timestamps.push(now);
      return true;
    }
    
    return false;
  }
}
```

### Priority Task Scheduler

```typescript
interface ScheduledTask {
  runAt: number;
  task: () => void;
  id: string;
}

class TaskScheduler {
  private tasks = new BinarySearchArray<ScheduledTask>(
    (a, b) => a.runAt - b.runAt
  );
  
  schedule(task: () => void, delayMs: number): string {
    const id = crypto.randomUUID();
    this.tasks.insert({
      runAt: Date.now() + delayMs,
      task,
      id
    });
    return id;
  }
  
  getNextTask(): ScheduledTask | undefined {
    if (this.tasks.length === 0) return undefined;
    
    const next = this.tasks.at(0);
    if (next && next.runAt <= Date.now()) {
      this.tasks.removeOne(0);
      return next;
    }
    
    return undefined;
  }
  
  cancel(id: string): boolean {
    const index = this.tasks.indexOf({ id } as any);
    if (index >= 0) {
      this.tasks.removeOne(index);
      return true;
    }
    return false;
  }
}
```

## Performance

FastDS significantly outperforms popular alternatives in various scenarios:

### Push + Shift Operations (Queue behavior)
```
FastDS RingBuffer:        65,390,479 ops/sec
denque:                   54,993,484 ops/sec (19% slower)
double-ended-queue:       38,349,016 ops/sec (41% slower)
```

### Element Removal
```
FastDS RingBuffer:       552,017,913 ops/sec
denque:                  416,564,218 ops/sec (25% slower)
```

### Array Creation from Large Dataset
```
FastDS RingBuffer:             1,831 ops/sec
denque:                        1,796 ops/sec (2% slower)
double-ended-queue:              387 ops/sec (79% slower)
```

## API Reference

### RingBuffer<T>

#### Constructor & Static Methods
- `new RingBuffer<T>(capacity?: number)` - Create a new ring buffer
- `RingBuffer.from<T>(values: T[])` - Create from an array

#### Properties
- `length: number` - Number of elements
- `capacity: number` - Current capacity

#### Core Operations
- `push(value: T): this` - Add to end
- `pop(): T | undefined` - Remove from end
- `shift(): T | undefined` - Remove from beginning
- `unshift(value: T): this` - Add to beginning

#### Access Methods
- `peekAt(index: number): T | undefined` - Get element at index
- `peekFirst(): T | undefined` - Get first element
- `peekLast(): T | undefined` - Get last element

#### Modification Methods
- `setOne(index: number, value: T, insert?: boolean): boolean` - Set/insert at index
- `removeOne(index: number): number` - Remove at index
- `removeFirst(value: T, index?: number): number` - Remove first occurrence
- `clear(): this` - Remove all elements

#### Utility Methods
- `toArray(): T[]` - Convert to array
- `slice(start?: number, end?: number): T[]` - Get slice as array
- `indexOf(value: T, index?: number): number` - Find index of value
- `has(value: T): boolean` - Check if contains value
- `compact(filter: (value: T) => boolean): boolean` - Filter and compact

### BinarySearchArray<T>

#### Constructor
- `new BinarySearchArray<T>(comparator: (a: T, b: T) => number)` - Create with comparator

#### Properties
- `length: number` - Number of elements

#### Operations
- `insert(value: T): number` - Insert in sorted position
- `at(index: number): T | undefined` - Get element at index
- `indexOf(value: T, index?: number): number` - Binary search for value
- `has(value: T): boolean` - Check if contains value
- `lowerBound(value: T): number` - Find first position >= value
- `upperBound(value: T): number` - Find first position > value
- `removeOne(index: number): number` - Remove at index
- `removeFirst(value: T): number` - Remove first occurrence

## TypeScript Support

FastDS is written in TypeScript and provides full type definitions:

```typescript
import { RingBuffer, BinarySearchArray, type Comparator } from 'fastds';

// Full type inference
const buffer = new RingBuffer<string>();
buffer.push(123); // ❌ Type error

// Custom types
interface User {
  id: number;
  name: string;
  score: number;
}

const users = new RingBuffer<User>();
const sortedUsers = new BinarySearchArray<User>(
  (a, b) => a.score - b.score
);
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[Apache-2.0 License](./LICENSE)

Copyright (c) 2025 Ivan Zakharchanka

[npm-url]: https://www.npmjs.com/package/fastds
[downloads-image]: https://img.shields.io/npm/dw/fastds.svg?maxAge=43200
[npm-image]: https://img.shields.io/npm/v/fastds.svg?maxAge=43200
[github-url]: https://github.com/3axap4eHko/fastds/actions
[github-image]: https://github.com/3axap4eHko/fastds/actions/workflows/build.yml/badge.svg?branch=master
[codecov-url]: https://codecov.io/gh/3axap4eHko/fastds
[codecov-image]: https://codecov.io/gh/3axap4eHko/fastds/branch/master/graph/badge.svg?maxAge=43200
[snyk-url]: https://snyk.io/test/npm/fastds/latest
[snyk-image]: https://snyk.io/test/github/3axap4eHko/fastds/badge.svg?maxAge=43200