import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { ExternalLink, Page, Verified } from 'ui/src/components/icons'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ExplorerDataType, getExplorerLink, openUri } from 'uniswap/src/utils/linking'
import { shortenAddress } from 'utilities/src/addresses'
import { logger } from 'utilities/src/logger/logger'

export interface ApprovalContractInfo {
  spenderContractAddress: string
  contractName?: string
  /** Show the raw address alongside the name — required for unverified sites */
  showAddress: boolean
  /** Canonical Uniswap contract — shows the pink verified badge */
  isVerifiedUniswapContract: boolean
}

/**
 * Always-visible "Contract" row pinned to the bottom of the transaction preview
 * card for approvals, showing the spender contract with an explorer link.
 */
export function ApprovalContractRow({
  contract,
  chainId,
}: {
  contract: ApprovalContractInfo
  chainId: UniverseChainId
}): JSX.Element {
  const { t } = useTranslation()

  const handleOpenExplorer = useCallback(() => {
    const explorerLink = getExplorerLink({
      chainId,
      data: contract.spenderContractAddress,
      type: ExplorerDataType.ADDRESS,
    })
    if (explorerLink) {
      openUri({ uri: explorerLink }).catch((e) => {
        logger.error(e, { tags: { file: 'ApprovalContractRow', function: 'handleOpenExplorer' } })
      })
    }
  }, [chainId, contract.spenderContractAddress])

  return (
    <Flex row alignItems="center" justifyContent="space-between" px="$spacing16">
      <Flex row gap="$spacing8" alignItems="center" flexShrink={0}>
        <Page color="$neutral2" size="$icon.16" />
        <Text color="$neutral2" variant="body3">
          {t('common.text.contract')}
        </Text>
      </Flex>
      <TouchableArea flexShrink={1} onPress={handleOpenExplorer}>
        <Flex row gap="$spacing4" alignItems="center">
          {contract.contractName && (
            <Text color="$neutral1" variant="body3" numberOfLines={1}>
              {contract.contractName}
            </Text>
          )}
          {contract.showAddress && (
            <Text color="$neutral2" variant="body3">
              {shortenAddress({ address: contract.spenderContractAddress })}
            </Text>
          )}
          {contract.isVerifiedUniswapContract && <Verified color="$accent1" size="$icon.12" mx="$spacing4" />}
          <ExternalLink color="$neutral3" size="$icon.16" />
        </Flex>
      </TouchableArea>
    </Flex>
  )
}
