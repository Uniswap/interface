import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { Code, CopyAlt, ExternalLink, LayerGroup, Page } from 'ui/src/components/icons'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { setClipboard } from 'uniswap/src/utils/clipboard'
import { ExplorerDataType, getExplorerLink, openUri } from 'uniswap/src/utils/linking'
import { shortenHash } from 'utilities/src/addresses'
import { logger } from 'utilities/src/logger/logger'
import { TransactionRiskLevel } from 'wallet/src/features/dappRequests/types'

interface TransactionRequestDetailsProps {
  functionName?: string
  contractName?: string
  contractAddress?: string
  rawData?: string
  chainId: UniverseChainId
  riskLevel: TransactionRiskLevel
}

/**
 * Expandable transaction details panel showing:
 * - Function name
 * - Contract name with external link
 * - Raw transaction data with copy button
 */
export function TransactionRequestDetails({
  functionName,
  contractName,
  contractAddress,
  rawData,
  chainId,
  riskLevel,
}: TransactionRequestDetailsProps): JSX.Element {
  const { t } = useTranslation()

  const detailsColor = riskLevel === TransactionRiskLevel.Warning ? '$statusWarning' : '$neutral1'

  const handleCopyRawData = useCallback(() => {
    if (rawData) {
      setClipboard(rawData).catch((e) => {
        logger.error(e, { tags: { file: 'TransactionRequestDetails', function: 'handleCopyRawData' } })
      })
    }
  }, [rawData])

  const handleOpenContract = useCallback(() => {
    if (contractAddress) {
      const explorerLink = getExplorerLink({
        chainId,
        data: contractAddress,
        type: ExplorerDataType.ADDRESS,
      })
      if (explorerLink) {
        openUri({ uri: explorerLink }).catch((e) => {
          logger.error(e, { tags: { file: 'TransactionRequestDetails', function: 'handleOpenContract' } })
        })
      }
    }
  }, [contractAddress, chainId])

  // Format raw data for display (truncate if too long)
  const formattedRawData = rawData ? (rawData.length > 12 ? shortenHash(rawData, 4) : rawData) : undefined

  return (
    <Flex gap="$spacing12" px="$spacing16">
      {/* Function name */}
      {functionName && (
        <Flex row alignItems="center" justifyContent="space-between" minHeight={16}>
          <Flex row gap="$spacing8" alignItems="center" flexShrink={0}>
            <Code color="$neutral2" size="$icon.16" />
            <Text color="$neutral2" variant="body4">
              {t('dapp.request.fallback.function.label')}
            </Text>
          </Flex>
          <Flex
            backgroundColor="$surface2"
            borderColor="$surface3"
            borderWidth="$spacing1"
            px="$spacing8"
            borderRadius="$rounded8"
            flexShrink={1}
          >
            <Text color={detailsColor} verticalAlign="center" variant="monospace" fontSize={12} numberOfLines={1}>
              {functionName}
            </Text>
          </Flex>
        </Flex>
      )}

      {/* Contract name */}
      {contractName && contractAddress && (
        <Flex row alignItems="center" justifyContent="space-between" height={16}>
          <Flex row gap="$spacing8" alignItems="center">
            <Page color="$neutral2" size="$icon.16" />
            <Text color="$neutral2" variant="body4">
              {t('common.text.contract')}
            </Text>
          </Flex>
          <TouchableArea onPress={handleOpenContract}>
            <Flex row gap="$spacing4" alignItems="center">
              <Text color={detailsColor} verticalAlign="center" variant="body4">
                {contractName}
              </Text>
              <ExternalLink color="$neutral3" size="$icon.16" />
            </Flex>
          </TouchableArea>
        </Flex>
      )}

      {/* Raw data */}
      {rawData && (
        <Flex row alignItems="center" justifyContent="space-between" height={16}>
          <Flex row gap="$spacing8" alignItems="center">
            <LayerGroup color="$neutral2" size="$icon.16" />
            <Text color="$neutral2" variant="body4">
              {t('dapp.request.fallback.calldata.label')}
            </Text>
          </Flex>
          <TouchableArea onPress={handleCopyRawData}>
            <Flex row gap="$spacing4" alignItems="center">
              <Text color="$neutral1" variant="body4">
                {formattedRawData}
              </Text>
              <CopyAlt color="$neutral3" size="$icon.16" />
            </Flex>
          </TouchableArea>
        </Flex>
      )}
    </Flex>
  )
}
