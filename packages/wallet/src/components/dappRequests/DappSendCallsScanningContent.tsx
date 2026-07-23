import { type TransactionRequest } from '@ethersproject/providers'
import { CHAIN_TO_ADDRESSES_MAP, NONFUNGIBLE_POSITION_MANAGER_ADDRESSES } from '@uniswap/sdk-core'
import type { BlockaidScanJsonRpcRequest, GasFeeResult, TradingApi } from '@universe/api'
import { numberToHex } from '@universe/encoding'
import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { GasFeeOverrides } from 'uniswap/src/features/gas/types'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { DappRequestFooter } from 'wallet/src/components/dappRequests/DappRequestFooter'
import { TransactionErrorType } from 'wallet/src/components/dappRequests/TransactionErrorSection'
import { TransactionLoadingState } from 'wallet/src/components/dappRequests/TransactionLoadingState'
import { TransactionPreviewCard } from 'wallet/src/components/dappRequests/TransactionPreviewCard'
import { useBlockaidJsonRpcScan } from 'wallet/src/features/dappRequests/hooks/useBlockaidJsonRpcScan'
import { useEarnAwareSections } from 'wallet/src/features/dappRequests/hooks/useEarnAwareSections'
import type { Call, TransactionAsset, TransactionSection } from 'wallet/src/features/dappRequests/types'
import { TransactionRiskLevel, TransactionSectionType } from 'wallet/src/features/dappRequests/types'
import {
  determineTransactionErrorType,
  extractContractName,
  extractFunctionName,
  parseTransactionSections,
} from 'wallet/src/features/dappRequests/utils/blockaidUtils'
import { buildBlockaidScanJsonRpcRequest } from 'wallet/src/features/dappRequests/utils/buildBlockaidScanJsonRpcRequest'

const ERC721_ASSET_TYPES = new Set(['ERC721', 'ERC1155', 'NFT'])

export function isV3NonfungiblePositionManager(address: string | undefined, chainId: UniverseChainId): boolean {
  if (!address) {
    return false
  }
  const expected = NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[chainId as number]
  return (
    !!expected &&
    areAddressesEqual({
      addressInput1: { address, chainId },
      addressInput2: { address: expected, chainId },
    })
  )
}

function isV4PositionManager(address: string | undefined, chainId: UniverseChainId): boolean {
  if (!address) {
    return false
  }
  // The `as keyof` cast asserts the chainId is a known key, which strips the
  // possibility of `undefined` from the lookup — restore it since not every
  // UniverseChainId is present in CHAIN_TO_ADDRESSES_MAP at runtime.
  const chainAddresses = CHAIN_TO_ADDRESSES_MAP[chainId as unknown as keyof typeof CHAIN_TO_ADDRESSES_MAP] as
    | (typeof CHAIN_TO_ADDRESSES_MAP)[keyof typeof CHAIN_TO_ADDRESSES_MAP]
    | undefined
  const expected = chainAddresses?.v4PositionManagerAddress
  return (
    !!expected &&
    areAddressesEqual({
      addressInput1: { address, chainId },
      addressInput2: { address: expected, chainId },
    })
  )
}

/**
 * Find the first V3 position NFT in a Sending section that doesn't already
 * have a matching Approving entry. Scoped to known V3 NonfungiblePositionManager
 * addresses so non-V3 NFTs are not mislabeled.
 */
function findUnapprovedV3NftSending(
  sections: TransactionSection[],
  chainId: UniverseChainId,
): TransactionAsset | undefined {
  const approvedAddresses = new Set(
    sections.filter((s) => s.type === TransactionSectionType.Approving).flatMap((s) => s.assets.map((a) => a.address)),
  )
  for (const section of sections) {
    if (section.type !== TransactionSectionType.Sending) {
      continue
    }
    const nft = section.assets.find(
      (a) =>
        ERC721_ASSET_TYPES.has(a.type) &&
        !approvedAddresses.has(a.address) &&
        isV3NonfungiblePositionManager(a.address, chainId),
    )
    if (nft) {
      return nft
    }
  }
  return undefined
}

interface DappSendCallsScanningContentProps {
  calls: Call[]
  chainId: UniverseChainId
  account: string
  dappUrl: string
  confirmedRisk: boolean
  onConfirmRisk: (confirmed: boolean) => void
  onRiskLevelChange: (riskLevel: TransactionRiskLevel) => void
  errorType?: TransactionErrorType
  gasFee?: GasFeeResult
  requestMethod?: string
  showSmartWalletActivation?: boolean
  gasOverrides?: GasFeeOverrides
  onChangeGasOverrides?: (overrides: GasFeeOverrides | undefined) => void
  /**
   * The encoded batched transaction request (7702 path) — needed by the
   * Network cost editor to fetch the recommended baseline. Optional because
   * 4337 sponsored-userOp flows have no concrete tx to estimate against.
   */
  tx?: TransactionRequest
  sponsorMetadata?: TradingApi.SponsorMetadata
}

/**
 * Shared component that handles Blockaid scanning for wallet_sendCalls requests
 * Scans the entire batch of calls and displays simulation results with risk analysis
 */
export function DappSendCallsScanningContent({
  calls,
  chainId,
  account,
  dappUrl,
  confirmedRisk,
  onConfirmRisk,
  onRiskLevelChange,
  errorType: providedErrorType,
  gasFee,
  requestMethod,
  showSmartWalletActivation,
  gasOverrides,
  onChangeGasOverrides,
  tx,
  sponsorMetadata,
}: DappSendCallsScanningContentProps): JSX.Element {
  const { t } = useTranslation()

  // Extract representative data from the first call for display purposes
  const firstCall = calls.length > 0 ? calls[0] : undefined
  const toAddress = firstCall?.to
  const rawData = firstCall?.data

  // Build Blockaid scan request for wallet_sendCalls
  const blockaidRequest = useMemo<BlockaidScanJsonRpcRequest | null>(() => {
    return buildBlockaidScanJsonRpcRequest({
      chainId,
      account,
      method: 'wallet_sendCalls',
      params: [
        {
          version: '1.0',
          chainId: numberToHex(chainId),
          from: account,
          calls,
        },
      ],
      dappUrl,
    })
  }, [chainId, account, calls, dappUrl])

  // Scan calls with Blockaid
  const { scanResult, isLoading: isScanLoading } = useBlockaidJsonRpcScan(blockaidRequest, blockaidRequest !== null)

  // Extract function name and contract name from simulation result
  const functionName = useMemo(() => extractFunctionName(scanResult), [scanResult])
  const contractName = useMemo(() => extractContractName(scanResult, toAddress), [scanResult, toAddress])

  // Parse the Blockaid scan result into displayable sections
  const { sections, riskLevel } = useMemo(
    () => parseTransactionSections(scanResult ?? null, chainId),
    [scanResult, chainId],
  )

  // Rename V3/V4 position NFTs to friendly labels across all sections,
  // and inject an Approving section for V3 NFTs approved off-chain.
  const mergedSections = useMemo(() => {
    const renamePositionNfts = (s: TransactionSection): TransactionSection => ({
      ...s,
      assets: s.assets.map((a) => {
        if (!ERC721_ASSET_TYPES.has(a.type)) {
          return a
        }
        if (isV3NonfungiblePositionManager(a.address, chainId)) {
          return { ...a, name: t('position.v3.nft') }
        }
        if (isV4PositionManager(a.address, chainId)) {
          return { ...a, name: t('position.v4.nft') }
        }
        return a
      }),
    })

    const renamed = sections.map(renamePositionNfts)

    const nft = findUnapprovedV3NftSending(sections, chainId)
    if (!nft) {
      return renamed
    }
    return [
      {
        type: TransactionSectionType.Approving,
        assets: [
          {
            type: nft.type,
            address: nft.address,
            chainId,
            name: t('position.v3.nft'),
            logoUrl: nft.logoUrl,
          },
        ],
      },
      ...renamed,
    ]
  }, [sections, chainId, t])

  // Collapse Earn deposit/withdraw into a dedicated Depositing/Withdrawing row when detected
  const earnAwareSections = useEarnAwareSections({ sections: mergedSections, chainId })

  // Determine the appropriate error type (if any) to display
  const errorType = determineTransactionErrorType({
    sections: earnAwareSections,
    providedErrorType,
    rawData: rawData ?? '',
  })

  // Notify parent when risk level changes
  useEffect(() => {
    onRiskLevelChange(riskLevel)
  }, [riskLevel, onRiskLevelChange])

  if (isScanLoading) {
    return <TransactionLoadingState />
  }

  return (
    <Flex gap="$spacing12">
      {/* Transaction Preview Card */}
      <TransactionPreviewCard
        sections={earnAwareSections}
        riskLevel={riskLevel}
        errorType={errorType}
        functionName={functionName}
        contractAddress={toAddress}
        contractName={contractName}
        rawData={rawData ?? ''}
        chainId={chainId}
      />

      <DappRequestFooter
        chainId={chainId}
        account={account}
        riskLevel={riskLevel}
        confirmedRisk={confirmedRisk}
        gasFee={gasFee}
        requestMethod={requestMethod}
        showSmartWalletActivation={showSmartWalletActivation}
        tx={tx}
        gasOverrides={gasOverrides}
        sponsorMetadata={sponsorMetadata}
        onChangeGasOverrides={onChangeGasOverrides}
        onConfirmRisk={onConfirmRisk}
      />
    </Flex>
  )
}
