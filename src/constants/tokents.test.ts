import { Evmos } from './tokens'

describe('Ether', () => {
  it('static constructor uses cache', () => {
    expect(Evmos.onChain(1) === Evmos.onChain(1)).toEqual(true)
  })
  it('caches once per chain ID', () => {
    expect(Evmos.onChain(1) !== Evmos.onChain(2)).toEqual(true)
  })
  it('#equals returns false for diff chains', () => {
    expect(Evmos.onChain(1).equals(Evmos.onChain(2))).toEqual(false)
  })
  it('#equals returns true for same chains', () => {
    expect(Evmos.onChain(1).equals(Evmos.onChain(1))).toEqual(true)
  })
})
