import { render, screen } from '@testing-library/react'
import React from 'react'
import type { SignTypedDataRequest } from 'src/app/features/dappRequests/types/DappRequestTypes'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

// The chain the preview is classified against must be wallet-owned. Feeding it the payload's own
// domain.chainId would make the check self-referential. These pin that it comes from the queued
// request's snapshot, and that a disagreeing payload never reaches the scan path.

const PERMIT2 = '0x000000000022D473030F116dDEE9F6B43aC78BA3'
const ACCOUNT = '0x1111111111111111111111111111111111111111'

let mockSnapshotChainId: number | undefined = UniverseChainId.Mainnet

vi.mock('src/app/features/dappRequests/DappRequestQueueContext', () => ({
  useDappRequestQueueContext: () => ({
    dappUrl: 'https://dapp.example',
    currentAccount: { address: ACCOUNT },
    request: { dappInfo: { lastChainId: mockSnapshotChainId } },
  }),
}))

// Rendering this means the component trusted a chain enough to scan on it.
vi.mock('wallet/src/components/dappRequests/DappSignTypedDataContent', () => ({
  DappSignTypedDataContent: ({ chainId }: { chainId: number }) => (
    <div data-testid="scan-path" data-chain-id={String(chainId)} />
  ),
}))

vi.mock('src/app/features/dappRequests/requestContent/EthSend/Swap/useSwapRequestPermissionedBlock', () => ({
  useUniswapXSwapPermissionedBlock: () => ({ isBlocked: false }),
}))

vi.mock('uniswap/src/features/smartWallet/mismatch/hooks', () => ({
  useHasAccountMismatchCallback: () => () => false,
}))

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useFeatureFlag: () => false,
}))

// Stubbed to keep these tests on routing, without the Tamagui theme and redux providers.
vi.mock('src/app/features/dappRequests/DappRequestContent', () => ({
  DappRequestContent: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('wallet/src/components/ErrorBoundary/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}))

vi.mock('ui/src', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  Flex: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('wallet/src/components/dappRequests/SignTypedData/Permit2Content', () => ({
  Permit2Content: () => <div data-testid="permit2-path" />,
}))

vi.mock('wallet/src/components/dappRequests/SignTypedData/StandardTypedDataContent', () => ({
  StandardTypedDataContent: () => <div data-testid="standard-path" />,
}))

import { SignTypedDataRequestContent } from 'src/app/features/dappRequests/requestContent/SignTypeData/SignTypedDataRequestContent'

function typedDataRequest(domainChainId: number): SignTypedDataRequest {
  return {
    type: 'SignTypedData',
    requestId: 'sig-1',
    address: ACCOUNT,
    typedData: JSON.stringify({
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
        PermitSingle: [{ name: 'spender', type: 'address' }],
      },
      primaryType: 'PermitSingle',
      domain: { name: 'Permit2', chainId: domainChainId, verifyingContract: PERMIT2 },
      message: { spender: '0x2222222222222222222222222222222222222222' },
    }),
  } as unknown as SignTypedDataRequest
}

describe('SignTypedDataRequestContent chain binding', () => {
  beforeEach(() => {
    mockSnapshotChainId = UniverseChainId.Mainnet
  })

  it('scans against the authorized snapshot chain, not the payload domain', () => {
    render(<SignTypedDataRequestContent dappRequest={typedDataRequest(UniverseChainId.Mainnet)} />)

    expect(screen.getByTestId('scan-path').getAttribute('data-chain-id')).toBe(String(UniverseChainId.Mainnet))
  })

  it('falls back to the raw view when the payload domain disagrees with the authorized chain', () => {
    render(<SignTypedDataRequestContent dappRequest={typedDataRequest(UniverseChainId.Optimism)} />)

    expect(screen.queryByTestId('scan-path')).toBeNull()
    // Fell back rather than rendering nothing.
    expect(screen.getByTestId('standard-path')).toBeTruthy()
  })

  it('falls back to the raw view when there is no authorized chain to bind to', () => {
    mockSnapshotChainId = undefined

    render(<SignTypedDataRequestContent dappRequest={typedDataRequest(UniverseChainId.Mainnet)} />)

    expect(screen.queryByTestId('scan-path')).toBeNull()
    expect(screen.getByTestId('standard-path')).toBeTruthy()
  })
})
