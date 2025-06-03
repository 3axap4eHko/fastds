# FASTds

[![Github Build Status][github-image]][github-url]
[![NPM version][npm-image]][npm-url]
[![Downloads][downloads-image]][npm-url]
[![Coverage Status][codecov-image]][codecov-url]
[![Snyk][snyk-image]][snyk-url]

Fast, Zero-Dependency, TypeScript-based data structures for high-performance applications.

## Why FastDS?

Modern JavaScript applications demand performance, especially when handling large datasets or high-frequency operations. FastDS bridges the gap between JavaScript's built-in data structures and the performance requirements of demanding applications.
Built with TypeScript and modern JavaScript features, FastDS provides the performance of low-level implementations with the convenience and safety of high-level APIs.

## Roadmap
 - Add documentation
 - Binary Search Buffer
 - Binary Tree
 - BTree

### RingBuffer
A circular buffer with O(1) push, shift, pop, unshift (amortized), index access, and fast deallocation. Written in TypeScript, optimized for minimal allocations.

## Benchmarks

thousand push+shift
```
denque x 54,993,484 ops/sec ±0.89% (95 runs sampled)
double-ended-queue x 38,349,016 ops/sec ±0.38% (99 runs sampled)
ring x 65,390,479 ops/sec ±0.59% (98 runs sampled)
```

2 million push+shift
```
denque x 54,993,484 ops/sec ±0.89% (95 runs sampled)
double-ended-queue x 38,349,016 ops/sec ±0.38% (99 runs sampled)
ring x 65,390,479 ops/sec ±0.59% (98 runs sampled)
```

removeOne
```
denque.removeOne x 2,862,276 ops/sec ±0.54% (98 runs sampled)
ring.removeOne x 2,267,222 ops/sec ±0.30% (96 runs sampled)
native array splice x 18,850 ops/sec ±0.39% (96 runs sampled)
```

remove
```
denque.remove x 398,419,866 ops/sec ±0.38% (57 runs sampled)
denque.remove 5k x 416,564,218 ops/sec ±0.24% (93 runs sampled)
ring.remove x 546,570,176 ops/sec ±0.52% (98 runs sampled)
ring.remove 5k x 552,017,913 ops/sec ±0.52% (95 runs sampled)
```

growth
```
denque x 60,619 ops/sec ±0.74% (96 runs sampled)
double-ended-queue x 38,682 ops/sec ±0.55% (95 runs sampled)
ring x 62,745 ops/sec ±0.38% (98 runs sampled)
```

fromArray
```
denque x 1,796 ops/sec ±1.32% (89 runs sampled)
double-ended-queue x 387 ops/sec ±2.11% (52 runs sampled)
ring x 1,831 ops/sec ±0.71% (96 runs sampled)
```
## License

License [Apache-2.0 License](./LICENSE)
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

