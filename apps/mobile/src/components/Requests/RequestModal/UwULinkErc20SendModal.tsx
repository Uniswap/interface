import { useBottomSheetInternal } from '@gorhom/bottom-sheet'
import { formatUnits } from 'ethers/lib/utils'
import { useTranslation } from 'react-i18next'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import { ModalWithOverlay } from 'src/components/Requests/ModalWithOverlay/ModalWithOverlay'
import { UwuLinkErc20Request } from 'src/features/walletConnect/walletConnectSlice'
import { Flex, SpinningLoader, Text, useIsDarkMode } from 'ui/src'
import { iconSizes, spacing } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { NetworkFee } from 'uniswap/src/components/gas/NetworkFee'
import { RemoteImage } from 'uniswap/src/components/nfts/images/RemoteImage'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useOnChainCurrencyBalance } from 'uniswap/src/features/portfolio/api'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

type Props = {
  onClose: () => void
  onConfirm: () => void
  onReject: () => void
  request: UwuLinkErc20Request
  hasSufficientGasFunds: boolean
  confirmEnabled: boolean
  gasFee: GasFeeResult
}

export function UwULinkErc20SendModal({
  gasFee,
  onClose,
  onConfirm,
  onReject,
  request,
  confirmEnabled,
  hasSufficientGasFunds,
}: Props): JSX.Element {
  const { t } = useTranslation()
  const activeAccountAddress = useActiveAccountAddressWithThrow()
  // TODO: wallet should determine if the currency is stablecoin
  const { chainId, tokenAddress, amount } = request
  const currencyInfo = useCurrencyInfo(buildCurrencyId(chainId, tokenAddress))
  const { balance } = useOnChainCurrencyBalance(currencyInfo?.currency, activeAccountAddress)

  const hasSufficientTokenFunds = !balance?.lessThan(amount)

  return (
    <ModalWithOverlay
      confirmationButtonText={t('common.button.pay')}
      contentContainerStyle={{
        paddingHorizontal: spacing.spacing24,
        paddingTop: spacing.spacing8,
      }}
      disableConfirm={!confirmEnabled || !hasSufficientTokenFunds || !hasSufficientGasFunds}
      name={ModalName.UwULinkErc20SendModal}
      scrollDownButtonText={t('walletConnect.request.button.scrollDown')}
      onClose={onClose}
      onConfirm={onConfirm}
      onReject={onReject}
    >
      <UwULinkErc20SendModalContent
        currencyInfo={currencyInfo}
        gasFee={gasFee}
        hasSufficientGasFunds={hasSufficientGasFunds}
        hasSufficientTokenFunds={hasSufficientTokenFunds}
        loading={!balance || !currencyInfo}
        request={request}
      />
    </ModalWithOverlay>
  )
}

function UwULinkErc20SendModalContent({
  gasFee,
  request,
  loading,
  currencyInfo,
  hasSufficientGasFunds,
  hasSufficientTokenFunds,
}: {
  gasFee: GasFeeResult
  request: UwuLinkErc20Request
  loading: boolean
  hasSufficientGasFunds: boolean
  hasSufficientTokenFunds: boolean
  currencyInfo: Maybe<CurrencyInfo>
}): JSX.Element {
  const { t } = useTranslation()
  const isDarkMode = useIsDarkMode()
  const { animatedFooterHeight } = useBottomSheetInternal()
  const bottomSpacerStyle = useAnimatedStyle(() => ({
    height: animatedFooterHeight.value,
  }))
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const { chainId, isStablecoin } = request
  const nativeCurrency = nativeOnChain(chainId)

  if (loading || !currencyInfo) {
    return (
      <Flex centered py="$spacing12">
        <SpinningLoader color="$accent1" size={iconSizes.icon64} />
        <Animated.View style={bottomSpacerStyle} />
      </Flex>
    )
  }

  const {
    logoUrl,
    currency: { name, symbol, decimals },
  } = currencyInfo

  const recipientLogoUrl = isDarkMode ? request.recipient.logo?.dark : request.recipient.logo?.light

  const formattedTokenAmount = isStablecoin
    ? convertFiatAmountFormatted(formatUnits(request.amount, decimals), NumberType.FiatStandard)
    : formatUnits(request.amount, decimals)

  return (
    <Flex centered gap="$spacing12" justifyContent="space-between">
      {recipientLogoUrl ? (
        <RemoteImage height={50} uri={recipientLogoUrl} width={200} />
      ) : (
        <Text variant="subheading1">{request.recipient.name}</Text>
      )}
      <Flex centered flex={1} gap="$spacing12" py="$spacing36">
        {!hasSufficientTokenFunds && (
          <Text color="red">
            {t('uwulink.error.insufficientTokens', {
              tokenSymbol: symbol ?? '',
              chain: getChainLabel(chainId),
            })}
          </Text>
        )}
        <Text fontSize={64} my="$spacing4" pt={42}>
          {formattedTokenAmount}
        </Text>
        <Flex row gap="$spacing8">
          <TokenLogo chainId={chainId} name={name} size={iconSizes.icon24} symbol={symbol} url={logoUrl} />
          <Text color="$neutral2">
            {formatUnits(request.amount, decimals)} {symbol}
          </Text>
        </Flex>
      </Flex>
      <Flex alignSelf="stretch" borderTopColor="$surface3" borderTopWidth={1} pt="$spacing16">
        <NetworkFee chainId={chainId} gasFee={gasFee} />
      </Flex>
      {!hasSufficientGasFunds && (
        <Text color="$statusWarning" pt="$spacing8" textAlign="center" variant="body3">
          {t('walletConnect.request.error.insufficientFunds', {
            currencySymbol: nativeCurrency.symbol ?? '',
          })}
        </Text>
      )}
      <Animated.View style={bottomSpacerStyle} />
    </Flex>
  )
}
