import JSBI from 'jsbi'
import { MaxUint256 } from '../constants'
import { sqrt } from './sqrt'

describe('#sqrt', () => {
  it('correct for 0-1000', () => {
    for (let i = 0; i < 1000; i++) {
      expect(sqrt(JSBI.BigInt(i))).toEqual(JSBI.BigInt(Math.floor(Math.sqrt(i))))
    }
  })

  describe('correct for all even powers of 2', () => {
    for (let i = 0; i < 256; i++) {
      it(`2^${i * 2}`, () => {
        const root = JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(i))
        const rootSquared = JSBI.multiply(root, root)

        expect(sqrt(rootSquared)).toEqual(root)
      })
    }
  })

  it('correct for MaxUint256', () => {
    expect(sqrt(MaxUint256)).toEqual(JSBI.BigInt('340282366920938463463374607431768211455'))
  })
})
