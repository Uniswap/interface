import { useBottomSheetInternal } from '@gorhom/bottom-sheet'
import { formatUnits } from 'ethers/lib/utils'
import { useTranslation } from 'react-i18next'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import { ModalWithOverlay } from 'src/components/WalletConnect/ModalWithOverlay/ModalWithOverlay'
import { UwuLinkErc20Request } from 'src/features/walletConnect/walletConnectSlice'
import { Flex, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { TokenLogo } from 'wallet/src/components/CurrencyLogo/TokenLogo'
import { SpinningLoader } from 'wallet/src/components/loading/SpinningLoader'
import { CHAIN_INFO } from 'wallet/src/constants/chains'
import { useOnChainCurrencyBalance } from 'wallet/src/features/portfolio/api'
import { NativeCurrency } from 'wallet/src/features/tokens/NativeCurrency'
import { useCurrencyInfo } from 'wallet/src/features/tokens/useCurrencyInfo'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'
import { ModalName } from 'wallet/src/telemetry/constants'
import { buildCurrencyId } from 'wallet/src/utils/currencyId'

type Props = {
  onClose: () => void
  onConfirm: () => void
  onReject: () => void
  request: UwuLinkErc20Request
  hasSufficientGasFunds: boolean
}

export function UwULinkErc20SendModal({
  onClose,
  onConfirm,
  onReject,
  request,
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
      disableConfirm={!hasSufficientTokenFunds || !hasSufficientGasFunds}
      name={ModalName.UwULinkErc20SendModal}
      scrollDownButtonText={t('walletConnect.request.button.scrollDown')}
      onClose={onClose}
      onConfirm={onConfirm}
      onReject={onReject}>
      <UwULinkErc20SendModalContent
        currencyInfo={currencyInfo}
        hasSufficientGasFunds={hasSufficientGasFunds}
        hasSufficientTokenFunds={hasSufficientTokenFunds}
        loading={!balance || !currencyInfo}
        request={request}
      />
    </ModalWithOverlay>
  )
}

function UwULinkErc20SendModalContent({
  request,
  loading,
  currencyInfo,
  hasSufficientGasFunds,
  hasSufficientTokenFunds,
}: {
  request: UwuLinkErc20Request
  loading: boolean
  hasSufficientGasFunds: boolean
  hasSufficientTokenFunds: boolean
  currencyInfo: Maybe<CurrencyInfo>
}): JSX.Element {
  const { t } = useTranslation()
  const { animatedFooterHeight } = useBottomSheetInternal()
  const bottomSpacerStyle = useAnimatedStyle(() => ({
    height: animatedFooterHeight.value,
  }))

  const { chainId, isStablecoin } = request
  const nativeCurrency = chainId && NativeCurrency.onChain(chainId)

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

  return (
    <Flex centered gap="$spacing12" justifyContent="space-between">
      <Text variant="subheading1">{request.recipient.name}</Text>
      <Flex centered flex={1} gap="$spacing12" py="$spacing16">
        {!hasSufficientTokenFunds && (
          <Text color="red">
            {t('uwulink.error.insufficientTokens', {
              tokenSymbol: symbol,
              chain: CHAIN_INFO[chainId].label,
            })}
          </Text>
        )}
        <Text fontSize={64} my="$spacing4" pt={42}>{`${isStablecoin ? '$' : ''}${formatUnits(
          request.amount,
          decimals
        )}`}</Text>
        <Flex row gap="$spacing4">
          <TokenLogo
            chainId={chainId}
            name={name}
            size={iconSizes.icon24}
            symbol={symbol}
            url={logoUrl}
          />
          <Text>{symbol}</Text>
        </Flex>
      </Flex>
      {!hasSufficientGasFunds && (
        <Text color="$DEP_accentWarning" pt="$spacing8" textAlign="center" variant="body3">
          {t('walletConnect.request.error.insufficientFunds', {
            currencySymbol: nativeCurrency?.symbol,
          })}
        </Text>
      )}
      <Animated.View style={bottomSpacerStyle} />
    </Flex>
  )
}
