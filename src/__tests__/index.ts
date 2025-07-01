import { describe, it, expect } from 'vitest';
import { BinarySearchArray, RingBuffer } from '../index.js';

describe('Index exports', () => {
  it('should export BinarySearchArray', () => {
    expect(BinarySearchArray).toBeDefined();
    const bsa = new BinarySearchArray();
    expect(bsa).toBeInstanceOf(BinarySearchArray);
  });

  it('should export RingBuffer', () => {
    expect(RingBuffer).toBeDefined();
    const rb = new RingBuffer();
    expect(rb).toBeInstanceOf(RingBuffer);
  });
});