import { act } from '@testing-library/react'
import { Percent } from '@uniswap/sdk-core'
import { USDC_MAINNET } from 'constants/tokens'
import store from 'state'
import { RouterPreference } from 'state/routing/types'
import { renderHook } from 'test-utils/render'

import { deserializeToken, serializeToken, useRouterPreference, useUserSlippageTolerance } from './hooks'
import { updateUserSlippageTolerance } from './reducer'
import { SlippageTolerance } from './types'

describe('serializeToken', () => {
  it('serializes the token', () => {
    expect(serializeToken(USDC_MAINNET)).toEqual({
      chainId: 1,
      decimals: 6,
      name: 'USD//C',
      symbol: 'USDC',
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    })
  })
})

describe('deserializeToken', () => {
  it('deserializes the token', () => {
    expect(deserializeToken(serializeToken(USDC_MAINNET))).toEqual(USDC_MAINNET)
  })
})

describe('useUserSlippageTolerance', () => {
  it('returns `auto` when user has not set a custom slippage', () => {
    const {
      result: {
        current: [slippage],
      },
    } = renderHook(() => useUserSlippageTolerance())
    expect(slippage).toEqual(SlippageTolerance.Auto)
  })
  it('returns `Percent` when user has set a custom slippage', () => {
    store.dispatch(updateUserSlippageTolerance({ userSlippageTolerance: 50 }))
    const {
      result: {
        current: [slippage],
      },
    } = renderHook(() => useUserSlippageTolerance())
    expect(slippage).toBeInstanceOf(Percent)
  })
  it('stores default slippage as `auto`', () => {
    const {
      result: {
        current: [, setSlippage],
      },
    } = renderHook(() => useUserSlippageTolerance())
    act(() => setSlippage(SlippageTolerance.Auto))
    expect(store.getState().user.userSlippageTolerance).toBe(SlippageTolerance.Auto)
  })
  it('stores custom slippage as `number`', () => {
    const {
      result: {
        current: [, setSlippage],
      },
    } = renderHook(() => useUserSlippageTolerance())
    act(() => setSlippage(new Percent(5, 10_000)))
    expect(store.getState().user.userSlippageTolerance).toBe(5)
  })
})

describe('useRouterPreference', () => {
  it('returns `x` by default', () => {
    const {
      result: {
        current: [routerPreference],
      },
    } = renderHook(() => useRouterPreference())
    expect(routerPreference).toBe(RouterPreference.X)
  })
})
