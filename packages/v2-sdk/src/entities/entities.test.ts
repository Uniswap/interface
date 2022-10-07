import JSBI from 'jsbi'
import invariant from 'tiny-invariant'
import { WETH9 as _WETH9, TradeType, Token, CurrencyAmount } from '@uniswap/sdk-core'
import { Pair, Route, Trade } from '../index'

const ADDRESSES = [
  '0x0000000000000000000000000000000000000001',
  '0x0000000000000000000000000000000000000002',
  '0x0000000000000000000000000000000000000003'
]
const CHAIN_ID = 3
const WETH9 = _WETH9[3]
const DECIMAL_PERMUTATIONS: [number, number, number][] = [
  [0, 0, 0],
  [0, 9, 18],
  [18, 18, 18]
]

function decimalize(amount: number, decimals: number): JSBI {
  return JSBI.multiply(JSBI.BigInt(amount), JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimals)))
}

describe('entities', () => {
  DECIMAL_PERMUTATIONS.forEach(decimals => {
    describe(`decimals permutation: ${decimals}`, () => {
      let tokens: Token[]
      beforeAll(() => {
        tokens = ADDRESSES.map((address, i) => new Token(CHAIN_ID, address, decimals[i]))
      })

      let pairs: Pair[]
      it('Pair', () => {
        pairs = [
          new Pair(
            CurrencyAmount.fromRawAmount(tokens[0], decimalize(1, tokens[0].decimals)),
            CurrencyAmount.fromRawAmount(tokens[1], decimalize(1, tokens[1].decimals))
          ),
          new Pair(
            CurrencyAmount.fromRawAmount(tokens[1], decimalize(1, tokens[1].decimals)),
            CurrencyAmount.fromRawAmount(tokens[2], decimalize(1, tokens[2].decimals))
          ),
          new Pair(
            CurrencyAmount.fromRawAmount(tokens[2], decimalize(1, tokens[2].decimals)),
            CurrencyAmount.fromRawAmount(WETH9, decimalize(1234, WETH9.decimals))
          )
        ]
      })

      let route: Route<Token, Token>
      it('Route', () => {
        route = new Route(pairs, tokens[0], WETH9)
        expect(route.pairs).toEqual(pairs)
        expect(route.path).toEqual(tokens.concat([WETH9]))
        expect(route.input).toEqual(tokens[0])
        expect(route.output).toEqual(WETH9)
      })

      it('#midPrice', () => {
        invariant(route.input.isToken)
        invariant(route.output.isToken)
        expect(
          route.midPrice.quote(CurrencyAmount.fromRawAmount(route.input, decimalize(1, route.input.decimals))).toExact()
        ).toEqual(CurrencyAmount.fromRawAmount(route.output, decimalize(1234, route.output.decimals)).toExact())
        expect(
          route.midPrice
            .invert()
            .quote(CurrencyAmount.fromRawAmount(route.output, decimalize(1234, route.output.decimals)))
            .toExact()
        ).toEqual(CurrencyAmount.fromRawAmount(route.input, decimalize(1, route.input.decimals)).toExact())

        expect(route.midPrice.invert().toSignificant(5)).toEqual('0.00081037')
        expect(route.midPrice.toFixed(2)).toEqual('1234.00')
        expect(route.midPrice.invert().toFixed(8)).toEqual('0.00081037')
      })

      describe('Trade', () => {
        let route: Route<Token, Token>
        it('TradeType.EXACT_INPUT', () => {
          route = new Route(
            [
              new Pair(
                CurrencyAmount.fromRawAmount(tokens[1], decimalize(5, tokens[1].decimals)),
                CurrencyAmount.fromRawAmount(WETH9, decimalize(10, WETH9.decimals))
              )
            ],
            tokens[1],
            WETH9
          )
          const inputAmount = CurrencyAmount.fromRawAmount(tokens[1], decimalize(1, tokens[1].decimals))
          const expectedOutputAmount = CurrencyAmount.fromRawAmount(WETH9, '1662497915624478906')
          const trade = new Trade(route, inputAmount, TradeType.EXACT_INPUT)
          expect(trade.route).toEqual(route)
          expect(trade.tradeType).toEqual(TradeType.EXACT_INPUT)
          expect(trade.inputAmount).toEqual(inputAmount)
          expect(trade.outputAmount).toEqual(expectedOutputAmount)

          expect(trade.executionPrice.toSignificant(18)).toEqual('1.66249791562447891')
          expect(trade.executionPrice.invert().toSignificant(18)).toEqual('0.601504513540621866')
          expect(trade.executionPrice.quote(inputAmount).quotient).toEqual(expectedOutputAmount.quotient)
          expect(trade.executionPrice.invert().quote(expectedOutputAmount).quotient).toEqual(inputAmount.quotient)

          expect(trade.priceImpact.toSignificant(18)).toEqual('16.8751042187760547')
        })

        it('TradeType.EXACT_OUTPUT', () => {
          const outputAmount = CurrencyAmount.fromRawAmount(WETH9, '1662497915624478906')
          const expectedInputAmount = CurrencyAmount.fromRawAmount(tokens[1], decimalize(1, tokens[1].decimals))
          const trade = new Trade(route, outputAmount, TradeType.EXACT_OUTPUT)
          expect(trade.route).toEqual(route)
          expect(trade.tradeType).toEqual(TradeType.EXACT_OUTPUT)
          expect(trade.outputAmount).toEqual(outputAmount)
          expect(trade.inputAmount).toEqual(expectedInputAmount)

          expect(trade.executionPrice.toSignificant(18)).toEqual('1.66249791562447891')
          expect(trade.executionPrice.invert().toSignificant(18)).toEqual('0.601504513540621866')
          expect(trade.executionPrice.quote(expectedInputAmount).quotient).toEqual(outputAmount.quotient)
          expect(trade.executionPrice.invert().quote(outputAmount).quotient).toEqual(expectedInputAmount.quotient)

          expect(trade.priceImpact.toSignificant(18)).toEqual('16.8751042187760547')
        })

        it('minimum TradeType.EXACT_INPUT', () => {
          if ([9, 18].includes(tokens[1].decimals)) {
            const route = new Route(
              [
                new Pair(
                  CurrencyAmount.fromRawAmount(tokens[1], decimalize(1, tokens[1].decimals)),
                  CurrencyAmount.fromRawAmount(
                    WETH9,
                    JSBI.add(
                      decimalize(10, WETH9.decimals),
                      tokens[1].decimals === 9 ? JSBI.BigInt('30090280812437312') : JSBI.BigInt('30090270812437322')
                    )
                  )
                )
              ],
              tokens[1],
              WETH9
            )
            const outputAmount = CurrencyAmount.fromRawAmount(tokens[1], '1')
            const trade = new Trade(route, outputAmount, TradeType.EXACT_INPUT)

            expect(trade.priceImpact.toSignificant(18)).toEqual(
              tokens[1].decimals === 9 ? '0.300000099400899902' : '0.3000000000000001'
            )
          }
        })
      })
    })
  })
})
