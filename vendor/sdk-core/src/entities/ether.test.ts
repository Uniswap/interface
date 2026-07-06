import { Ether } from './ether'

describe('Ether', () => {
  it('static constructor uses cache', () => {
    // eslint-disable-next-line no-self-compare
    expect(Ether.onChain(1) === Ether.onChain(1)).toEqual(true)
  })
  it('caches once per chain ID', () => {
    expect(Ether.onChain(1) !== Ether.onChain(2)).toEqual(true)
  })
  it('#equals returns false for diff chains', () => {
    expect(Ether.onChain(1).equals(Ether.onChain(2))).toEqual(false)
  })
  it('#equals returns true for same chains', () => {
    expect(Ether.onChain(1).equals(Ether.onChain(1))).toEqual(true)
  })
  it('#wrapped returns Robinhood WETH', () => {
    expect(Ether.onChain(4663).wrapped.address).toEqual('0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73')
  })
  it('#wrapped throws for Arc because WETH is unsupported', () => {
    expect(() => Ether.onChain(5042).wrapped).toThrow('WRAPPED')
  })
})
