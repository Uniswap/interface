import { sortedInsert } from './sortedInsert'

describe('#sortedInsert', () => {
  const comp = (a: number, b: number) => a - b

  it('throws if maxSize is 0', () => {
    expect(() => sortedInsert([], 1, 0, comp)).toThrow('MAX_SIZE_ZERO')
  })

  it('throws if items.length > maxSize', () => {
    expect(() => sortedInsert([1, 2], 1, 1, comp)).toThrow('ITEMS_SIZE')
  })

  it('adds if empty', () => {
    const arr: number[] = []
    expect(sortedInsert(arr, 3, 2, comp)).toEqual(null)
    expect(arr).toEqual([3])
  })

  it('adds if not full', () => {
    const arr: number[] = [1, 5]
    expect(sortedInsert(arr, 3, 3, comp)).toEqual(null)
    expect(arr).toEqual([1, 3, 5])
  })

  it('adds if will not be full after', () => {
    const arr: number[] = [1]
    expect(sortedInsert(arr, 0, 3, comp)).toEqual(null)
    expect(arr).toEqual([0, 1])
  })

  it('returns add if sorts after last', () => {
    const arr = [1, 2, 3]
    expect(sortedInsert(arr, 4, 3, comp)).toEqual(4)
    expect(arr).toEqual([1, 2, 3])
  })

  it('removes from end if full', () => {
    const arr = [1, 3, 4]
    expect(sortedInsert(arr, 2, 3, comp)).toEqual(4)
    expect(arr).toEqual([1, 2, 3])
  })

  it('uses comparator', () => {
    const arr = [4, 2, 1]
    expect(sortedInsert(arr, 3, 3, (a, b) => comp(a, b) * -1)).toEqual(1)
    expect(arr).toEqual([4, 3, 2])
  })

  describe('maxSize of 1', () => {
    it('empty add', () => {
      const arr: number[] = []
      expect(sortedInsert(arr, 3, 1, comp)).toEqual(null)
      expect(arr).toEqual([3])
    })
    it('full add greater', () => {
      const arr: number[] = [2]
      expect(sortedInsert(arr, 3, 1, comp)).toEqual(3)
      expect(arr).toEqual([2])
    })
    it('full add lesser', () => {
      const arr: number[] = [4]
      expect(sortedInsert(arr, 3, 1, comp)).toEqual(4)
      expect(arr).toEqual([3])
    })
  })
})
