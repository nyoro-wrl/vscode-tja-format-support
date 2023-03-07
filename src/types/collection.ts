/**
 * 汎用的なメソッドつきのRecord
 */
export interface ICollection<T> {
  /**
   * コレクションの一覧
   */
  items: Record<string, T>;
  [Symbol.iterator](): IterableIterator<T>;
}

/**
 * 汎用的なメソッドつきのRecord
 */
export class Collection<T> implements ICollection<T> {
  items: Record<string, T>;

  constructor(items: Record<string, T>) {
    this.items = items;
  }

  *[Symbol.iterator](): IterableIterator<T> {
    const keys = Object.keys(this.items);
    for (let i = 0; i < keys.length; i++) {
      yield this.items[keys[i]];
    }
  }
}
