import { describe, it, expect } from 'vitest';
import { BinarySearchArray } from '../binary-search.js';

const numComparator = (a: number, b: number) => a - b;

describe('BinarySearchArray', () => {
  it('should be empty by default', () => {
    const bsa = new BinarySearchArray(numComparator);
    expect(bsa.length).toBe(0);
  });

  it('should insert elements in sorted order', () => {
    const bsa = new BinarySearchArray(numComparator);
    bsa.insert(5);
    bsa.insert(2);
    bsa.insert(8);
    bsa.insert(1);
    
    expect([...bsa]).toEqual([1, 2, 5, 8]);
  });

  it('should find correct lowerBound', () => {
    const bsa = new BinarySearchArray(numComparator);
    [1, 3, 3, 5, 7].forEach(val => bsa.insert(val));
    
    expect(bsa.lowerBound(0)).toBe(0);
    expect(bsa.lowerBound(1)).toBe(0);
    expect(bsa.lowerBound(3)).toBe(1);
    expect(bsa.lowerBound(5)).toBe(3);
    expect(bsa.lowerBound(6)).toBe(4);
    expect(bsa.lowerBound(10)).toBe(5);
  });

  it('should find correct upperBound', () => {
    const bsa = new BinarySearchArray(numComparator);
    [1, 3, 3, 5, 7].forEach(val => bsa.insert(val));
    
    expect(bsa.upperBound(0)).toBe(0);
    expect(bsa.upperBound(1)).toBe(1);
    expect(bsa.upperBound(3)).toBe(3);
    expect(bsa.upperBound(5)).toBe(4);
    expect(bsa.upperBound(7)).toBe(5);
    expect(bsa.upperBound(10)).toBe(5);
  });

  it('should find indexOf correctly', () => {
    const bsa = new BinarySearchArray(numComparator);
    [1, 3, 3, 5, 7].forEach(val => bsa.insert(val));
    
    expect(bsa.indexOf(1)).toBe(0);
    expect(bsa.indexOf(3)).toBeGreaterThanOrEqual(1);
    expect(bsa.indexOf(3)).toBeLessThanOrEqual(2);
    expect(bsa.indexOf(5)).toBe(3);
    expect(bsa.indexOf(7)).toBe(4);
    expect(bsa.indexOf(10)).toBe(-1);
  });

  it('should check has() correctly', () => {
    const bsa = new BinarySearchArray(numComparator);
    [1, 3, 5].forEach(val => bsa.insert(val));
    
    expect(bsa.has(1)).toBe(true);
    expect(bsa.has(3)).toBe(true);
    expect(bsa.has(5)).toBe(true);
    expect(bsa.has(2)).toBe(false);
    expect(bsa.has(10)).toBe(false);
  });

  it('should remove elements correctly', () => {
    const bsa = new BinarySearchArray(numComparator);
    [1, 2, 3, 4, 5].forEach(val => bsa.insert(val));
    
    bsa.removeFirst(3);
    expect([...bsa]).toEqual([1, 2, 4, 5]);
    
    bsa.removeOne(0);
    expect([...bsa]).toEqual([2, 4, 5]);
  });

  it('should handle empty array edge cases', () => {
    const bsa = new BinarySearchArray(numComparator);
    expect(bsa.lowerBound(5)).toBe(0);
    expect(bsa.upperBound(5)).toBe(0);
    expect(bsa.indexOf(5)).toBe(-1);
    expect(bsa.has(5)).toBe(false);
  });

  it('should access elements with at()', () => {
    const bsa = new BinarySearchArray(numComparator);
    [1, 3, 5].forEach(val => bsa.insert(val));
    
    expect(bsa.at(0)).toBe(1);
    expect(bsa.at(1)).toBe(3);
    expect(bsa.at(2)).toBe(5);
  });

  it('should remove elements with remove method', () => {
    const bsa = new BinarySearchArray(numComparator);
    [1, 2, 3, 4, 5].forEach(val => bsa.insert(val));
    const result = bsa.remove(1, 2);
    expect(result).toBe(bsa); // Returns this for chaining
    expect([...bsa]).toEqual([1, 4, 5]); // Use iterator instead of toArray
  });

  it('should return iterator from iter method', () => {
    const bsa = new BinarySearchArray(numComparator);
    [1, 2, 3].forEach(val => bsa.insert(val));
    const iter = bsa.iter();
    expect(iter.next().value).toBe(1);
    expect(iter.next().value).toBe(2);
    expect(iter.next().value).toBe(3);
    expect(iter.next().done).toBe(true);
  });
});
