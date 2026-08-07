import { render, screen } from '@testing-library/react'
import React from 'react'
import type { DappRequestStoreItemForEthSendTxn } from 'src/app/features/dappRequests/slice'

// Dispatch-level coverage for the ECO-379 hard block. The refusal screen (SwapRequestContent /
// PermissionedSwapBlockedContent) used to live ONLY in the Blockaid-failure fallback, so when
// scanning succeeded the user saw the approvable scan UI instead. These tests mount the dispatch
// entry point with Blockaid HEALTHY (the scan UI renders, the ErrorBoundary never falls back) and
// assert the primary-path gate refuses a permissioned, non-allowlisted swap before any approve
// control can render.

const mockUseUniversalRouterSwapPermissionedBlock = vi.fn()
vi.mock('src/app/features/dappRequests/requestContent/EthSend/Swap/useSwapRequestPermissionedBlock', () => ({
  useUniversalRouterSwapPermissionedBlock: (args: unknown) => mockUseUniversalRouterSwapPermissionedBlock(args),
}))

// Healthy Blockaid scan UI: renders an approve control. If the gate fails, this (and its confirm
// button) would render for a blocked swap.
vi.mock(
  'src/app/features/dappRequests/requestContent/EthSend/ParsedTransaction/ParsedTransactionRequestContent',
  () => ({
    ParsedTransactionRequestContent: () => (
      <div data-testid="scan-ui">
        <button data-testid="scan-confirm">confirm</button>
      </div>
    ),
  }),
)

vi.mock('src/app/features/dappRequests/requestContent/EthSend/Swap/PermissionedSwapBlockedContent', () => ({
  PermissionedSwapBlockedContent: ({ blockedSymbol }: { blockedSymbol: string | undefined }) => (
    <div data-testid="refusal" data-symbol={blockedSymbol} />
  ),
}))

// Render children directly: models Blockaid scanning succeeding (no fallback).
vi.mock('wallet/src/components/ErrorBoundary/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Sibling content components only render in the fallback (never reached here); stub to keep the
// dispatch import light.
vi.mock('src/app/features/dappRequests/requestContent/EthSend/Approve/ApproveRequestContent', () => ({
  ApproveRequestContent: () => <div data-testid="approve-ui" />,
}))
vi.mock('src/app/features/dappRequests/requestContent/EthSend/FallbackEthSend/FallbackEthSend', () => ({
  FallbackEthSendRequestContent: () => <div data-testid="fallback-ui" />,
}))
vi.mock('src/app/features/dappRequests/requestContent/EthSend/LP/LPRequestContent', () => ({
  LPRequestContent: () => <div data-testid="lp-ui" />,
}))
vi.mock('src/app/features/dappRequests/requestContent/EthSend/Permit2Approve/Permit2ApproveRequestContent', () => ({
  Permit2ApproveRequestContent: () => <div data-testid="permit2-ui" />,
}))
vi.mock('src/app/features/dappRequests/requestContent/EthSend/Swap/SwapRequestContent', () => ({
  SwapRequestContent: () => <div data-testid="swap-fallback-ui" />,
}))
vi.mock('src/app/features/dappRequests/requestContent/EthSend/Wrap/WrapRequestContent', () => ({
  WrapRequestContent: () => <div data-testid="wrap-ui" />,
}))

const mockOnConfirm = vi.fn()
const mockOnCancel = vi.fn()
const WALLET_ADDRESS = '0x1111111111111111111111111111111111111111'
vi.mock('src/app/features/dappRequests/DappRequestQueueContext', () => ({
  useDappRequestQueueContext: () => ({
    dappUrl: 'https://dapp.example',
    currentAccount: { address: '0x1111111111111111111111111111111111111111' },
    onConfirm: mockOnConfirm,
    onCancel: mockOnCancel,
  }),
}))

vi.mock('src/app/features/dapp/hooks', () => ({
  useDappLastChainId: () => 1,
}))

vi.mock('src/app/features/dappRequests/hooks/usePrepareAndSignEthSendTransaction', () => ({
  usePrepareAndSignEthSendTransaction: () => ({
    gasFeeResult: { value: '1000', isLoading: false, error: null },
    requestWithGasValues: {},
    preSignedTransaction: undefined,
  }),
}))

vi.mock('uniswap/src/features/gas/hooks/useEnableCustomGasFeeEntry', () => ({
  useEnableCustomGasFeeEntry: () => false,
}))

// Only the swap predicate is exercised (the gate is reached for swap requests); the others guard
// the fallback, which never renders because Blockaid is healthy.
vi.mock('src/app/features/dappRequests/types/DappRequestTypes', () => ({
  isApproveRequest: vi.fn(() => false),
  isLPRequest: vi.fn(() => false),
  isPermit2ApproveRequest: vi.fn(() => false),
  isSwapRequest: vi.fn(() => true),
  isWrapRequest: vi.fn(() => false),
}))

vi.mock('utilities/src/logger/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn() },
}))

import { EthSendRequestContent } from 'src/app/features/dappRequests/requestContent/EthSend/EthSend'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

const swapRequest = {
  // transaction.chainId is pinned at request intake and is what the content reads to bind
  // pre-signing to the reviewed chain.
  dappRequest: { parsedCalldata: { commands: [] }, transaction: { chainId: UniverseChainId.Mainnet } },
} as unknown as DappRequestStoreItemForEthSendTxn

describe('EthSendRequestContent permissioned-swap gate (Blockaid healthy)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('refuses a permissioned, non-allowlisted swap with no approve control even though scanning succeeds', () => {
    mockUseUniversalRouterSwapPermissionedBlock.mockReturnValue({
      isBlocked: true,
      blockedSymbol: 'PTOK2',
      kycUrl: 'https://app.superstate.com',
    })

    render(<EthSendRequestContent request={swapRequest} />)

    expect(screen.getByTestId('refusal')).toBeTruthy()
    expect(screen.getByTestId('refusal').getAttribute('data-symbol')).toBe('PTOK2')
    // The healthy scan UI and its approve control must never mount for a blocked swap.
    expect(screen.queryByTestId('scan-ui')).toBeNull()
    expect(screen.queryByTestId('scan-confirm')).toBeNull()
  })

  it('renders the scan UI for a swap that is not blocked', () => {
    mockUseUniversalRouterSwapPermissionedBlock.mockReturnValue({ isBlocked: false })

    render(<EthSendRequestContent request={swapRequest} />)

    expect(screen.getByTestId('scan-ui')).toBeTruthy()
    expect(screen.getByTestId('scan-confirm')).toBeTruthy()
    expect(screen.queryByTestId('refusal')).toBeNull()
  })

  it('keys the gate on the dapp-request signing account', () => {
    mockUseUniversalRouterSwapPermissionedBlock.mockReturnValue({ isBlocked: false })

    render(<EthSendRequestContent request={swapRequest} />)

    // The gate must consult the block hook keyed on the account the request signs with
    // (currentAccount.address), never the wallet's globally-active account.
    expect(mockUseUniversalRouterSwapPermissionedBlock).toHaveBeenCalledWith(
      expect.objectContaining({ walletAddress: WALLET_ADDRESS }),
    )
  })
})
