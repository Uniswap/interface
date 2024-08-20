import { useConnectedWallets } from 'state/wallets/hooks'
import { Wallet } from 'state/wallets/types'
import { act, renderHook } from 'test-utils/render'

describe('useConnectedWallets', () => {
  it('should return the connected wallets', () => {
    const { result } = renderHook(() => useConnectedWallets())
    expect(result.current[0]).toEqual([])
  })
  it('should add a wallet', () => {
    const { result } = renderHook(() => useConnectedWallets())
    const wallet: Wallet = {
      walletName: 'Uniswap Extension',
      account: '0x123',
    }
    act(() => {
      result.current[1](wallet)
    })
    expect(result.current[0]).toEqual([wallet])
  })
})
