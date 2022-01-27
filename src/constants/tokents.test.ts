import { Photon } from './tokens'

describe('Ether', () => {
  it('static constructor uses cache', () => {
    expect(Photon.onChain(1) === Photon.onChain(1)).toEqual(true)
  })
  it('caches once per chain ID', () => {
    expect(Photon.onChain(1) !== Photon.onChain(2)).toEqual(true)
  })
  it('#equals returns false for diff chains', () => {
    expect(Photon.onChain(1).equals(Photon.onChain(2))).toEqual(false)
  })
  it('#equals returns true for same chains', () => {
    expect(Photon.onChain(1).equals(Photon.onChain(1))).toEqual(true)
  })
})
