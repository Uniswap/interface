import { act, renderHook } from '@testing-library/react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { EarnEntryPoint } from 'uniswap/src/features/earn/analytics'
import { EarnVaultView } from 'uniswap/src/features/earn/hooks/useEarnVaultModalFlow'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { useEarnVaultModalState } from '~/features/earn/hooks/useEarnVaultModalState'

const VAULT_A: EarnVaultInfo = {
  id: 'vault-a',
  currencyId: '1-0xa',
  displayCurrencyId: '1-0xa',
  vaultAddress: '0xa',
  chainId: UniverseChainId.Mainnet,
  apyPercent: 4,
  exposureCurrencyIds: [],
  totalDepositsUsd: 0,
  liquidityUsd: 0,
  curator: { name: 'Gauntlet' },
}
const VAULT_B: EarnVaultInfo = { ...VAULT_A, id: 'vault-b', vaultAddress: '0xb' }

describe(useEarnVaultModalState, () => {
  it('starts with no selection', () => {
    const { result } = renderHook(() => useEarnVaultModalState())

    expect(result.current.selectedVaultState).toBeNull()
  })

  it('opens the modal with the Vault view by default', () => {
    const { result } = renderHook(() => useEarnVaultModalState())

    act(() => result.current.openModal(VAULT_A))

    expect(result.current.selectedVaultState).toEqual({ vault: VAULT_A, initialView: EarnVaultView.Vault })
  })

  it('respects an explicit initialView when opening', () => {
    const { result } = renderHook(() => useEarnVaultModalState())

    act(() => result.current.openModal(VAULT_A, { initialView: EarnVaultView.WithdrawAmount }))

    expect(result.current.selectedVaultState).toEqual({
      vault: VAULT_A,
      initialView: EarnVaultView.WithdrawAmount,
    })
  })

  it('openDepositModal preselects the DepositAmount view', () => {
    const { result } = renderHook(() => useEarnVaultModalState())

    act(() => result.current.openDepositModal(VAULT_A))

    expect(result.current.selectedVaultState).toEqual({
      vault: VAULT_A,
      initialView: EarnVaultView.DepositAmount,
    })
  })

  it('stores per-open analytics entry point options', () => {
    const { result } = renderHook(() => useEarnVaultModalState())

    act(() => result.current.openDepositModal(VAULT_A, { analyticsEntryPoint: EarnEntryPoint.PortfolioEarnGetToken }))

    expect(result.current.selectedVaultState).toEqual({
      vault: VAULT_A,
      initialView: EarnVaultView.DepositAmount,
      analyticsEntryPoint: EarnEntryPoint.PortfolioEarnGetToken,
    })
  })

  it('openWithdrawModal preselects the WithdrawAmount view', () => {
    const { result } = renderHook(() => useEarnVaultModalState())

    act(() => result.current.openWithdrawModal(VAULT_A))

    expect(result.current.selectedVaultState).toEqual({
      vault: VAULT_A,
      initialView: EarnVaultView.WithdrawAmount,
    })
  })

  it('clears state on closeModal', () => {
    const { result } = renderHook(() => useEarnVaultModalState())

    act(() => result.current.openDepositModal(VAULT_A))
    expect(result.current.selectedVaultState).not.toBeNull()

    act(() => result.current.closeModal())
    expect(result.current.selectedVaultState).toBeNull()
  })

  it('replaces the selection when opening a different vault', () => {
    const { result } = renderHook(() => useEarnVaultModalState())

    act(() => result.current.openModal(VAULT_A))
    act(() => result.current.openModal(VAULT_B, { initialView: EarnVaultView.WithdrawAmount }))

    expect(result.current.selectedVaultState).toEqual({
      vault: VAULT_B,
      initialView: EarnVaultView.WithdrawAmount,
    })
  })
})
