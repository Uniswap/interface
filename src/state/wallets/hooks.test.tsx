import { act, renderHook } from 'test-utils'

import { useConnectedWallets } from './hooks'
import { Wallet } from './types'

describe('useConnectedWallets', () => {
  it('should return the connected wallets', () => {
    const { result } = renderHook(() => useConnectedWallets())
    expect(result.current[0]).toEqual([])
  })
  it('should add a wallet', () => {
    const { result } = renderHook(() => useConnectedWallets())
    const wallet: Wallet = {
      walletType: 'injected',
      account: '0x123',
    }
    act(() => {
      result.current[1](wallet)
    })
    expect(result.current[0]).toEqual([wallet])
  })
})
