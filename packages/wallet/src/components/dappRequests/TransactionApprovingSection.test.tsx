import { UniverseChainId } from '@universe/chains'
import { shortenAddress } from 'utilities/src/addresses'
import {
  formatAssetDisplay,
  TransactionApprovingSection,
} from 'wallet/src/components/dappRequests/TransactionApprovingSection'
import {
  TransactionApprovalAction,
  TransactionApprovalScope,
  TransactionRiskLevel,
  type TransactionAsset,
} from 'wallet/src/features/dappRequests/types'
import { render, screen } from 'wallet/src/test/test-utils'

vi.mock('wallet/src/components/dappRequests/AssetLogo', () => ({ AssetLogo: () => null }))

const NFT_ADDRESS = '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d'
const TOKEN_ADDRESS = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
const SPENDER_ADDRESS = '0xa77ac4e2a77ac4e2a77ac4e2a77ac4e2a77ac4e2'
const OTHER_SPENDER_ADDRESS = '0xb88bc4e2b88bc4e2b88bc4e2b88bc4e2b88bc4e2'

function nftAsset(overrides: Partial<TransactionAsset>): TransactionAsset {
  return {
    type: 'ERC721',
    address: NFT_ADDRESS,
    chainId: UniverseChainId.Mainnet,
    symbol: 'BAYC',
    spenderAddress: SPENDER_ADDRESS,
    ...overrides,
  }
}

function erc20Asset(spenderAddress: string, overrides: Partial<TransactionAsset> = {}): TransactionAsset {
  return {
    type: 'ERC20',
    address: TOKEN_ADDRESS,
    chainId: UniverseChainId.Mainnet,
    symbol: 'USDC',
    amount: '100',
    approvalAction: TransactionApprovalAction.Grant,
    spenderAddress,
    ...overrides,
  }
}

function formatAsset(asset: TransactionAsset): string {
  const t = ((key: string, values?: Record<string, string>) => {
    if (key === 'dapp.request.approve.token') {
      return `${values?.['assetName']} #${values?.['tokenId']}`
    }
    if (key === 'dapp.request.approve.allItems') {
      return `All ${values?.['assetName']} items`
    }
    return key
  }) as Parameters<typeof formatAssetDisplay>[0]['t']
  const formatNumberOrString = (({ value }: { value: string }) => value) as Parameters<
    typeof formatAssetDisplay
  >[0]['formatNumberOrString']

  return formatAssetDisplay({ asset, t, formatNumberOrString })
}

describe('formatAssetDisplay', () => {
  it('includes an NFT token ID', () => {
    expect(formatAsset(nftAsset({ tokenId: '8817', approvalScope: TransactionApprovalScope.SingleToken }))).toBe(
      'BAYC #8817',
    )
    expect(formatAsset(nftAsset({ tokenId: '42', approvalScope: TransactionApprovalScope.SingleToken }))).toBe(
      'BAYC #42',
    )
  })

  it('describes collection scope without a revoke amount', () => {
    expect(
      formatAsset(
        nftAsset({
          approvalScope: TransactionApprovalScope.Collection,
          approvalAction: TransactionApprovalAction.Revoke,
        }),
      ),
    ).toBe('All BAYC items')
    expect(formatAsset(nftAsset({ amount: '0', approvalAction: TransactionApprovalAction.Revoke }))).toBe('BAYC')
  })

  it('keeps tiny and explicit-zero grants distinguishable from revokes', () => {
    expect(
      formatAsset(
        erc20Asset(SPENDER_ADDRESS, {
          amount: '0.000000000000000001',
          approvalAction: TransactionApprovalAction.Grant,
        }),
      ),
    ).toBe('0.000000000000000001 USDC')
    expect(
      formatAsset(erc20Asset(SPENDER_ADDRESS, { amount: '0', approvalAction: TransactionApprovalAction.Grant })),
    ).toBe('0 USDC')
    expect(
      formatAsset(erc20Asset(SPENDER_ADDRESS, { amount: '0', approvalAction: TransactionApprovalAction.Revoke })),
    ).toBe('USDC')
  })
})

describe('TransactionApprovingSection NFT approvals', () => {
  it('keeps distinct token IDs visible under a neutral permission-change heading', () => {
    render(
      <TransactionApprovingSection
        riskLevel={TransactionRiskLevel.None}
        assets={[
          nftAsset({
            tokenId: '8817',
            approvalScope: TransactionApprovalScope.SingleToken,
            approvalAction: TransactionApprovalAction.Change,
          }),
          nftAsset({
            tokenId: '42',
            approvalScope: TransactionApprovalScope.SingleToken,
            approvalAction: TransactionApprovalAction.Change,
          }),
        ]}
      />,
    )

    expect(screen.getByText('dapp.request.approve.permissionChange')).toBeTruthy()
    expect(screen.getAllByText('dapp.request.approve.token')).toHaveLength(2)
    expect(screen.getAllByText('common.addresses.count')).toHaveLength(2)
  })

  it('renders a decoded collection revoke without calling it unlimited', () => {
    render(
      <TransactionApprovingSection
        riskLevel={TransactionRiskLevel.None}
        assets={[
          nftAsset({
            approvalScope: TransactionApprovalScope.Collection,
            approvalAction: TransactionApprovalAction.Revoke,
          }),
        ]}
      />,
    )

    expect(screen.getByText('dapp.request.revoke.action')).toBeTruthy()
    expect(screen.getByText('dapp.request.approve.allItems')).toBeTruthy()
    expect(screen.queryByText('transaction.amount.unlimited')).toBeNull()
    expect(screen.getByText('common.addresses.count')).toBeTruthy()
  })
})

describe('TransactionApprovingSection ERC20 approvals', () => {
  it('does not repeat a single spender in the addresses popover', () => {
    render(<TransactionApprovingSection riskLevel={TransactionRiskLevel.None} assets={[erc20Asset(SPENDER_ADDRESS)]} />)

    expect(screen.queryByText('common.addresses.count')).toBeNull()
  })

  it('keeps the addresses popover for multiple ERC20 spenders', () => {
    render(
      <TransactionApprovingSection
        riskLevel={TransactionRiskLevel.None}
        assets={[erc20Asset(SPENDER_ADDRESS), erc20Asset(OTHER_SPENDER_ADDRESS)]}
      />,
    )

    expect(screen.getByText('common.addresses.count')).toBeTruthy()
  })
})

describe('TransactionApprovingSection NONERC exposures', () => {
  it('shows the asset and spender under a neutral heading without an invented allowance', () => {
    const asset: TransactionAsset = {
      type: 'NONERC',
      address: TOKEN_ADDRESS,
      chainId: UniverseChainId.Arc,
      spenderAddress: SPENDER_ADDRESS,
      approvalAction: TransactionApprovalAction.Change,
    }
    render(<TransactionApprovingSection riskLevel={TransactionRiskLevel.None} assets={[asset]} />)

    expect(screen.getByText('dapp.request.approve.permissionChange')).toBeTruthy()
    expect(screen.getByText(shortenAddress({ address: TOKEN_ADDRESS }))).toBeTruthy()
    expect(screen.getByText('dapp.request.amountUnavailable')).toBeTruthy()
    expect(screen.getByText('common.addresses.count')).toBeTruthy()
    expect(screen.queryByText('common.approving')).toBeNull()
    expect(screen.queryByText('dapp.request.revoke.action')).toBeNull()
    expect(screen.queryByText('transaction.amount.unlimited')).toBeNull()
  })
})
