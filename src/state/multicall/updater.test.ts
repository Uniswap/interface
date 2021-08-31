import { activeListeningKeys, outdatedListeningKeys } from './updater'

describe('multicall updater', () => {
  describe('#activeListeningKeys', () => {
    it('ignores 0, returns call key to block age key', () => {
      expect(
        activeListeningKeys(
          {
            [1]: {
              ['abc']: {
                4: 2, // 2 listeners care about 4 block old data
                1: 0, // 0 listeners care about 1 block old data
              },
            },
          },
          1
        )
      ).toEqual({
        abc: 4,
      })
    })
    it('applies min', () => {
      expect(
        activeListeningKeys(
          {
            [1]: {
              ['abc']: {
                4: 2, // 2 listeners care about 4 block old data
                3: 1, // 1 listener cares about 3 block old data
                1: 0, // 0 listeners care about 1 block old data
              },
            },
          },
          1
        )
      ).toEqual({
        abc: 3,
      })
    })
    it('works for infinity', () => {
      expect(
        activeListeningKeys(
          {
            [1]: {
              ['abc']: {
                4: 2, // 2 listeners care about 4 block old data
                1: 0, // 0 listeners care about 1 block old data
              },
              ['def']: {
                Infinity: 2,
              },
            },
          },
          1
        )
      ).toEqual({
        abc: 4,
        def: Infinity,
      })
    })
    it('multiple keys', () => {
      expect(
        activeListeningKeys(
          {
            [1]: {
              ['abc']: {
                4: 2, // 2 listeners care about 4 block old data
                1: 0, // 0 listeners care about 1 block old data
              },
              ['def']: {
                2: 1,
                5: 2,
              },
            },
          },
          1
        )
      ).toEqual({
        abc: 4,
        def: 2,
      })
    })
    it('ignores negative numbers', () => {
      expect(
        activeListeningKeys(
          {
            [1]: {
              ['abc']: {
                4: 2,
                1: -1,
                [-3]: 4,
              },
            },
          },
          1
        )
      ).toEqual({
        abc: 4,
      })
    })
    it('applies min to infinity', () => {
      expect(
        activeListeningKeys(
          {
            [1]: {
              ['abc']: {
                Infinity: 2, // 2 listeners care about any data
                4: 2, // 2 listeners care about 4 block old data
                1: 0, // 0 listeners care about 1 block old data
              },
            },
          },
          1
        )
      ).toEqual({
        abc: 4,
      })
    })
  })

  describe('#outdatedListeningKeys', () => {
    it('returns empty if missing block number or chain id', () => {
      expect(outdatedListeningKeys({}, { abc: 2 }, undefined, undefined)).toEqual([])
      expect(outdatedListeningKeys({}, { abc: 2 }, 1, undefined)).toEqual([])
      expect(outdatedListeningKeys({}, { abc: 2 }, undefined, 1)).toEqual([])
    })
    it('returns everything for no results', () => {
      expect(outdatedListeningKeys({}, { abc: 2, def: 3 }, 1, 1)).toEqual(['abc', 'def'])
    })
    it('returns only outdated keys', () => {
      expect(
        outdatedListeningKeys({ [1]: { abc: { data: '0x', blockNumber: 2 } } }, { abc: 1, def: 1 }, 1, 2)
      ).toEqual(['def'])
    })
    it('returns only keys not being fetched', () => {
      expect(
        outdatedListeningKeys(
          {
            [1]: { abc: { data: '0x', blockNumber: 2 }, def: { fetchingBlockNumber: 2 } },
          },
          { abc: 1, def: 1 },
          1,
          2
        )
      ).toEqual([])
    })
    it('returns keys being fetched for old blocks', () => {
      expect(
        outdatedListeningKeys(
          { [1]: { abc: { data: '0x', blockNumber: 2 }, def: { fetchingBlockNumber: 1 } } },
          { abc: 1, def: 1 },
          1,
          2
        )
      ).toEqual(['def'])
    })
    it('respects blocks per fetch', () => {
      expect(
        outdatedListeningKeys(
          { [1]: { abc: { data: '0x', blockNumber: 2 }, def: { data: '0x', fetchingBlockNumber: 1 } } },
          { abc: 2, def: 2 },
          1,
          3
        )
      ).toEqual(['def'])
    })
  })
})
