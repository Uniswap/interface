import { GasFeeResult, TradingApi } from '@universe/api'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { SponsoredFee, UniswapXFee } from 'uniswap/src/components/gas/NetworkFee'
import { NetworkFeeWarning } from 'uniswap/src/components/gas/NetworkFeeWarning'
import { ContentRow } from 'uniswap/src/components/transactions/requests/ContentRow'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { DappRequestType, EthMethod, EthSignMethod } from 'uniswap/src/features/dappRequests/types'
import { useGasFeeFormattedDisplayAmounts } from 'uniswap/src/features/gas/hooks'

interface NetworkFeeFooterProps {
  chainId: UniverseChainId
  showNetworkLogo: boolean
  gasFee: GasFeeResult | undefined
  isUniswapX?: boolean
  requestMethod?: string
  showSmartWalletActivation?: boolean
  /** When set, the gas amount is replaced with the sponsor icon + "Free". */
  sponsorMetadata?: TradingApi.SponsorMetadata
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

/**
 * Returns true when the supplied request method is one that submits a tx
 * on-chain (and therefore costs gas). Exported so the gas-overrides Network
 * cost row can mirror the same gating used to hide the legacy fee footer for
 * signature-only methods.
 */
export function isGasBearingMethod(requestMethod: string | undefined): boolean {
  if (typeof requestMethod !== 'string') {
    return true
  }
  return !SignatureMethods.includes(requestMethod)
}

export function NetworkFeeFooter({
  chainId,
  showNetworkLogo,
  gasFee,
  isUniswapX,
  requestMethod,
  showSmartWalletActivation,
  sponsorMetadata,
}: NetworkFeeFooterProps): JSX.Element | null {
  const { t } = useTranslation()
  const variant = 'body3'

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
      <ContentRow
        label={
          <Flex>
            <Flex row gap="$spacing4" alignItems="center">
              <Text color="$neutral2" variant={variant}>
                {t('transaction.networkCost.label')}
              </Text>
              <NetworkFeeWarning includesDelegation={showSmartWalletActivation} chainId={chainId} />
            </Flex>
            {showSmartWalletActivation && (
              <Text color="$neutral3" variant="body4">
                {t('transaction.networkCost.includesSmartWalletActivation')}
              </Text>
            )}
          </Flex>
        }
      >
        <Flex centered row gap="$spacing4">
          {sponsorMetadata ? (
            <SponsoredFee sponsorMetadata={sponsorMetadata} preSavingsGasFee={gasFeeFormatted} />
          ) : (
            <>
              {showNetworkLogo && <NetworkLogo chainId={chainId} size={iconSizes.icon16} />}
              {isUniswapX ? (
                <UniswapXFee gasFee={gasFeeFormatted} />
              ) : (
                <Text color="$neutral1" variant={variant}>
                  {gasFeeFormatted}
                </Text>
              )}
            </>
          )}
        </Flex>
      </ContentRow>
    </Flex>
  )
}
