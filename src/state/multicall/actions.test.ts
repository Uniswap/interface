import { parseCallKey, toCallKey } from './actions'

describe('actions', () => {
  describe('#parseCallKey', () => {
    it('does not throw for invalid address', () => {
      expect(parseCallKey('0x-0x')).toEqual({ address: '0x', callData: '0x' })
    })
    it('does not throw for invalid calldata', () => {
      expect(parseCallKey('0x6b175474e89094c44da98b954eedeac495271d0f-abc')).toEqual({
        address: '0x6b175474e89094c44da98b954eedeac495271d0f',
        callData: 'abc',
      })
    })
    it('throws for invalid format', () => {
      expect(() => parseCallKey('abc')).toThrow('Invalid call key: abc')
    })
    it('throws for uppercase calldata', () => {
      expect(parseCallKey('0x6b175474e89094c44da98b954eedeac495271d0f-0xabcD')).toEqual({
        address: '0x6b175474e89094c44da98b954eedeac495271d0f',
        callData: '0xabcD',
      })
    })
    it('parses pieces into address', () => {
      expect(parseCallKey('0x6b175474e89094c44da98b954eedeac495271d0f-0xabcd')).toEqual({
        address: '0x6b175474e89094c44da98b954eedeac495271d0f',
        callData: '0xabcd',
      })
    })
  })

  describe('#toCallKey', () => {
    it('throws for invalid address', () => {
      expect(() => toCallKey({ callData: '0x', address: '0x' })).toThrow('Invalid address: 0x')
    })
    it('throws for invalid calldata', () => {
      expect(() =>
        toCallKey({
          address: '0x6b175474e89094c44da98b954eedeac495271d0f',
          callData: 'abc',
        })
      ).toThrow('Invalid hex: abc')
    })
    it('throws for uppercase hex', () => {
      expect(() =>
        toCallKey({
          address: '0x6b175474e89094c44da98b954eedeac495271d0f',
          callData: '0xabcD',
        })
      ).toThrow('Invalid hex: 0xabcD')
    })
    it('concatenates address to data', () => {
      expect(toCallKey({ address: '0x6b175474e89094c44da98b954eedeac495271d0f', callData: '0xabcd' })).toEqual(
        '0x6b175474e89094c44da98b954eedeac495271d0f-0xabcd'
      )
    })
  })
})
