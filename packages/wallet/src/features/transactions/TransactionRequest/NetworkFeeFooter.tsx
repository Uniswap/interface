import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { UniswapXFee } from 'uniswap/src/components/gas/NetworkFee'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { DappRequestType, EthMethod, EthSignMethod } from 'uniswap/src/features/dappRequests/types'
import { useGasFeeFormattedDisplayAmounts } from 'uniswap/src/features/gas/hooks'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { isMobileApp } from 'utilities/src/platform'
import { ContentRow } from 'wallet/src/features/transactions/TransactionRequest/ContentRow'

interface NetworkFeeFooterProps {
  chainId: UniverseChainId
  showNetworkLogo: boolean
  gasFee: GasFeeResult | undefined
  isUniswapX?: boolean
  requestMethod?: string
}

// Since EthSignMethod is a TypeScript type that doesn't exist at runtime,
// we need to explicitly list its values here for string comparison
const ethSignMethod: EthSignMethod[] = [
  EthMethod.PersonalSign,
  EthMethod.SignTypedData,
  EthMethod.SignTypedDataV4,
  EthMethod.EthSign,
]

const SignatureMethods: Array<string> = [
  ...ethSignMethod,
  DappRequestType.SignMessage,
  DappRequestType.SignTransaction,
  DappRequestType.SignTypedData,
]

export function NetworkFeeFooter({
  chainId,
  showNetworkLogo,
  gasFee,
  isUniswapX,
  requestMethod,
}: NetworkFeeFooterProps): JSX.Element | null {
  const { t } = useTranslation()
  const variant = isMobileApp ? 'body3' : 'body4'

  const { gasFeeFormatted } = useGasFeeFormattedDisplayAmounts({
    gasFee,
    chainId,
    placeholder: '-',
  })

  if (typeof requestMethod === 'string' && SignatureMethods.includes(requestMethod)) {
    return null
  }

  return (
    <Flex px="$spacing8">
      <ContentRow label={t('transaction.networkCost.label')} variant={variant}>
        <Flex centered row gap="$spacing4">
          {showNetworkLogo && <NetworkLogo chainId={chainId} size={iconSizes.icon16} />}
          {isUniswapX ? (
            <UniswapXFee gasFee={gasFeeFormatted} />
          ) : (
            <Text color="$neutral1" variant={variant}>
              {gasFeeFormatted}
            </Text>
          )}
        </Flex>
      </ContentRow>
    </Flex>
  )
}
