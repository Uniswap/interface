import { useTranslation } from 'react-i18next'
import { ReceiveButton } from 'src/components/TokenDetails/ReceiveButton'
import { Flex, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useBridgingTokenWithHighestBalance } from 'uniswap/src/features/bridging/hooks/tokens'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useCurrencyInfo, useNativeCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { BridgeTokenButton } from 'uniswap/src/features/transactions/InsufficientNativeTokenWarning/BridgeTokenButton'
import { BuyNativeTokenButton } from 'uniswap/src/features/transactions/InsufficientNativeTokenWarning/BuyNativeTokenButton'
import { currencyIdToAddress } from 'uniswap/src/utils/currencyId'
import { useActiveAccountAddress } from 'wallet/src/features/wallet/hooks'

export function BuyNativeTokenModal({
  chainId,
  currencyId,
  onClose,
}: {
  chainId: UniverseChainId
  currencyId: string
  onClose: () => void
}): JSX.Element | null {
  const { t } = useTranslation()
  const activeAddress = useActiveAccountAddress()
  const nativeCurrencyInfo = useNativeCurrencyInfo(chainId)
  const currencyInfo = useCurrencyInfo(currencyId)

  const { data: bridgingTokenWithHighestBalance } = useBridgingTokenWithHighestBalance({
    address: activeAddress ?? '',
    currencyAddress: currencyIdToAddress(nativeCurrencyInfo?.currencyId ?? ''),
    currencyChainId: chainId,
  })

  if (!nativeCurrencyInfo || !currencyInfo) {
    return null
  }

  const chainName = getChainInfo(chainId).label
  const formattedChainName = chainId === UniverseChainId.Mainnet ? '' : `(${chainName})`

  const nativeTokenSymbol =
    chainId === UniverseChainId.Mainnet
      ? nativeCurrencyInfo.currency.symbol ?? ''
      : `${chainName} ${nativeCurrencyInfo.currency.symbol ?? ''}`

  return (
    <Modal isDismissible alignment="top" name={ModalName.BuyNativeToken} onClose={onClose}>
      <Flex centered gap="$spacing24" px="$spacing24" py="$spacing12">
        <Flex centered gap="$spacing16">
          <CurrencyLogo currencyInfo={nativeCurrencyInfo} size={iconSizes.icon48} />
          <Flex centered gap="$spacing8">
            <Text variant="subheading1">
              {t('token.zeroNativeBalance.title', { nativeTokenName: nativeCurrencyInfo.currency.name ?? '' })}
              {formattedChainName}
            </Text>
            <Text color="$neutral2" textAlign="center" variant="body3" px="$spacing8">
              {t('token.zeroNativeBalance.description', {
                tokenSymbol: currencyInfo.currency.symbol ?? '',
                nativeTokenSymbol,
              })}
            </Text>
          </Flex>
          <LearnMoreLink
            textColor="$accent3"
            textVariant="buttonLabel3"
            url={uniswapUrls.helpArticleUrls.networkFeeInfo}
          />
        </Flex>
        <Flex centered gap="$spacing8" width="100%">
          {bridgingTokenWithHighestBalance && (
            <BridgeTokenButton
              inputToken={bridgingTokenWithHighestBalance.currencyInfo}
              outputToken={nativeCurrencyInfo}
              outputNetworkName={chainName}
              onPress={onClose}
            />
          )}
          <BuyNativeTokenButton
            usesStaticText
            usesStaticTheme={false}
            nativeCurrencyInfo={nativeCurrencyInfo}
            onPress={onClose}
          />
          {!bridgingTokenWithHighestBalance && <ReceiveButton onPress={onClose} />}
        </Flex>
      </Flex>
    </Modal>
  )
}
