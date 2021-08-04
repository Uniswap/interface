import { useRoutes } from './useRoutes'
import { renderHook } from '@testing-library/react-hooks'
import { Token } from '@uniswap/sdk-core'
import { useGetQuoteQuery } from './slice'
import { skipToken } from '@reduxjs/toolkit/dist/query'
import { useUserRoutingAPIEnabled } from 'state/user/hooks'

const USDC = new Token(1, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC')
const DAI = new Token(1, '0x6B175474E89094C44Da98b954EedeAC495271d0F', 6, 'DAI')
const MKR = new Token(1, '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2', 6, 'MKR')

// helper function to make amounts more readable
const amount = (raw: TemplateStringsArray) => (parseInt(raw[0]) * 1e6).toString()

describe('#useRoute', () => {
  it('handles empty edges and nodes', () => {
    const { result } = renderHook(() =>
      useRoutes(USDC, DAI, {
        routeEdges: [],
        routeNodes: [],
      })
    )

    expect(result.current).toEqual([])
  })

  it('handles a single route trade from DAI to USDC', () => {
    const { result } = renderHook(() =>
      useRoutes(DAI, USDC, {
        routeEdges: [
          {
            amountIn: amount`1`,
            amountOut: amount`5`,
            fee: '500',
            id: '0x1f8F72aA9304c8B593d555F12eF6589cC3A579A2',
            inId: DAI.wrapped.address,
            outId: USDC.wrapped.address,
            type: 'EXACT_IN',
            sqrtRatioX96: '2437312313659959819381354528',
            liquidity: '10272714736694327408',
            tickCurrent: '-69633',
          },
        ],
        routeNodes: [
          {
            ...DAI,
            id: DAI.wrapped.address,
            decimals: DAI.decimals.toString(), // todo wrapper around GetQuoteResult to simplify types?
          },
          {
            ...USDC,
            id: USDC.wrapped.address,
            decimals: USDC.decimals.toString(),
          },
        ],
      })
    )

    expect(result.current).toBeDefined()
    expect(result.current?.length).toBe(1)
    expect(result.current && result.current[0].route.input).toBe(DAI)
    expect(result.current && result.current[0].route.output).toBe(USDC)
    expect(result.current && result.current[0].route.tokenPath).toEqual([DAI, USDC])
    expect(result.current && result.current[0].inputAmount.toSignificant()).toBe('1')
    expect(result.current && result.current[0].outputAmount.toSignificant()).toBe('5')
  })

  it('handles a multi-route trade from DAI to USDC', () => {
    const { result } = renderHook(() =>
      useRoutes(DAI, USDC, {
        routeEdges: [
          {
            amountIn: amount`5`,
            amountOut: amount`6`,
            fee: '500',
            id: '0x1f8F72aA9304c8B593d555F12eF6589cC3A579A2',
            inId: DAI.wrapped.address,
            outId: USDC.wrapped.address,
            type: 'EXACT_IN',
            sqrtRatioX96: '2437312313659959819381354528',
            liquidity: '10272714736694327408',
            tickCurrent: '-69633',
          },
          {
            amountIn: amount`10`,
            amountOut: amount`1`,
            fee: '3000',
            id: '0x2f8F72aA9304c8B593d555F12eF6589cC3A579A2',
            inId: DAI.wrapped.address,
            outId: MKR.wrapped.address,
            type: 'EXACT_IN',
            sqrtRatioX96: '2437312313659959819381354528',
            liquidity: '10272714736694327408',
            tickCurrent: '-69633',
          },
          {
            amountIn: amount`1`,
            amountOut: amount`200`,
            fee: '10000',
            id: '0x3f8F72aA9304c8B593d555F12eF6589cC3A579A2',
            inId: MKR.wrapped.address,
            outId: USDC.wrapped.address,
            type: 'EXACT_IN',
            sqrtRatioX96: '2437312313659959819381354528',
            liquidity: '10272714736694327408',
            tickCurrent: '-69633',
          },
        ],
        routeNodes: [
          {
            ...DAI,
            id: DAI.wrapped.address,
            decimals: DAI.decimals.toString(),
          },
          {
            ...USDC,
            id: USDC.wrapped.address,
            decimals: USDC.decimals.toString(),
          },
          {
            ...MKR,
            id: MKR.wrapped.address,
            decimals: MKR.decimals.toString(),
          },
        ],
      })
    )

    expect(result.current).toBeDefined()
    expect(result.current?.length).toBe(2)

    expect(result.current && result.current[0].route.input).toBe(DAI)
    expect(result.current && result.current[0].route.output).toBe(USDC)
    expect(result.current && result.current[0].route.tokenPath).toEqual([DAI, USDC])
    expect(result.current && result.current[1].route.input).toBe(DAI)
    expect(result.current && result.current[1].route.output).toBe(USDC)
    expect(result.current && result.current[1].route.tokenPath).toEqual([DAI, MKR, USDC])

    expect(result.current && result.current[0].inputAmount.toSignificant()).toBe('5')
    expect(result.current && result.current[0].outputAmount.toSignificant()).toBe('6')
    expect(result.current && result.current[1].inputAmount.toSignificant()).toBe('10')
    expect(result.current && result.current[1].outputAmount.toSignificant()).toBe('200')
  })

  xit('handles invalid fee amount', () => {
    const { result } = renderHook(() =>
      useRoutes(DAI, USDC, {
        routeEdges: [
          {
            amountIn: '99',
            amountOut: '101',
            fee: 'NOT_A_FEE_AMOUNT',
            id: '0x1f8F72aA9304c8B593d555F12eF6589cC3A579A2',
            inId: DAI.wrapped.address,
            outId: USDC.wrapped.address,
            type: 'EXACT_IN',
            sqrtRatioX96: '2437312313659959819381354528',
            liquidity: '10272714736694327408',
            tickCurrent: '-69633',
          },
        ],
        routeNodes: [
          {
            ...DAI,
            id: DAI.wrapped.address,
            decimals: DAI.decimals.toString(),
          },
          {
            ...USDC,
            id: USDC.wrapped.address,
            decimals: USDC.decimals.toString(),
          },
        ],
      })
    )

    expect(result.current).toBeUndefined()
  })
})
