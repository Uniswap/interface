import { renderHook } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { describe, expect, it } from 'vitest'
import { useReconcileCreateNewTokenNetwork } from '~/pages/Liquidity/CreateAuction/hooks/useReconcileCreateNewTokenNetwork'
import { CreateAuctionStoreContext } from '~/pages/Liquidity/CreateAuction/store/CreateAuctionStoreContext'
import {
  type CreateAuctionStore,
  createCreateAuctionStore,
} from '~/pages/Liquidity/CreateAuction/store/createCreateAuctionStore'
import { TokenMode } from '~/pages/Liquidity/CreateAuction/types'

function renderReconcile(
  store: CreateAuctionStore,
  args: { selectedNetwork: UniverseChainId; allowedNetworks: UniverseChainId[] },
): void {
  renderHook(() => useReconcileCreateNewTokenNetwork(args), {
    wrapper: ({ children }: { children: ReactNode }) =>
      createElement(CreateAuctionStoreContext.Provider, { value: store }, children),
  })
}

function selectedNetworkOf(store: CreateAuctionStore): UniverseChainId | undefined {
  const { tokenForm } = store.getState()
  return tokenForm.mode === TokenMode.CREATE_NEW ? tokenForm.network : undefined
}

describe('useReconcileCreateNewTokenNetwork', () => {
  it('snaps the selected network to the first allowed chain when it is no longer allowed', () => {
    const store = createCreateAuctionStore()
    store.getState().actions.updateCreateNewTokenField('network', UniverseChainId.Unichain)

    renderReconcile(store, { selectedNetwork: UniverseChainId.Unichain, allowedNetworks: [UniverseChainId.Sepolia] })

    expect(selectedNetworkOf(store)).toBe(UniverseChainId.Sepolia)
  })

  it('leaves the selected network untouched when it is still allowed', () => {
    const store = createCreateAuctionStore()
    store.getState().actions.updateCreateNewTokenField('network', UniverseChainId.Unichain)

    renderReconcile(store, {
      selectedNetwork: UniverseChainId.Unichain,
      allowedNetworks: [UniverseChainId.Mainnet, UniverseChainId.Unichain, UniverseChainId.Base],
    })

    expect(selectedNetworkOf(store)).toBe(UniverseChainId.Unichain)
  })

  it('leaves the selected network untouched when no networks are allowed', () => {
    const store = createCreateAuctionStore()
    store.getState().actions.updateCreateNewTokenField('network', UniverseChainId.Unichain)

    renderReconcile(store, { selectedNetwork: UniverseChainId.Unichain, allowedNetworks: [] })

    expect(selectedNetworkOf(store)).toBe(UniverseChainId.Unichain)
  })
})
