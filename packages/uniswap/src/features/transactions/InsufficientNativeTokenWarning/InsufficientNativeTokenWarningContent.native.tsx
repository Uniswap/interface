import { Currency } from '@uniswap/sdk-core'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useBridgingTokenWithHighestBalance } from 'uniswap/src/features/bridging/hooks/tokens'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { BridgeTokenButton } from 'uniswap/src/features/transactions/InsufficientNativeTokenWarning/BridgeTokenButton'
import { BuyNativeTokenButton } from 'uniswap/src/features/transactions/InsufficientNativeTokenWarning/BuyNativeTokenButton'
import { InsufficientNativeTokenBaseComponent } from 'uniswap/src/features/transactions/InsufficientNativeTokenWarning/InsufficientNativeTokenBaseComponent'
import { useInsufficientNativeTokenWarning } from 'uniswap/src/features/transactions/InsufficientNativeTokenWarning/useInsufficientNativeTokenWarning'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { currencyIdToAddress } from 'uniswap/src/utils/currencyId'

export function InsufficientNativeTokenWarningContent({
  address,
  parsedInsufficentNativeTokenWarning,
  nativeCurrencyInfo,
  nativeCurrency,
}: {
  address: Address
  parsedInsufficentNativeTokenWarning: NonNullable<ReturnType<typeof useInsufficientNativeTokenWarning>>
  nativeCurrencyInfo: CurrencyInfo
  nativeCurrency: Currency
}): JSX.Element {
  const { t } = useTranslation()
  const [showModal, setShowModal] = useState(false)

  const { networkName, modalOrTooltipMainMessage } = parsedInsufficentNativeTokenWarning

  const currencyAddress = currencyIdToAddress(nativeCurrencyInfo.currencyId)

  const bridgingTokenWithHighestBalance = useBridgingTokenWithHighestBalance({
    address,
    currencyAddress,
    currencyChainId: nativeCurrencyInfo.currency.chainId,
  })

  const shouldShowNetworkName = nativeCurrency.symbol === 'ETH' && nativeCurrency.chainId !== UniverseChainId.Mainnet

  return (
    <>
      <TouchableArea onPress={(): void => setShowModal(true)}>
        <InsufficientNativeTokenBaseComponent
          parsedInsufficentNativeTokenWarning={parsedInsufficentNativeTokenWarning}
        />
      </TouchableArea>

      {showModal && (
        <WarningModal
          isOpen
          backgroundIconColor={false}
          icon={<CurrencyLogo currencyInfo={nativeCurrencyInfo} />}
          modalName={ModalName.SwapWarning}
          title={
            shouldShowNetworkName
              ? t('transaction.warning.insufficientGas.modal.title.withNetwork', {
                  tokenSymbol: nativeCurrency.symbol,
                  networkName,
                })
              : t('transaction.warning.insufficientGas.modal.title.withoutNetwork', {
                  tokenSymbol: nativeCurrency.symbol,
                })
          }
          onClose={(): void => setShowModal(false)}
        >
          <Flex centered gap="$spacing16" width="100%">
            <Text color="$neutral2" textAlign="center" variant="body3">
              {modalOrTooltipMainMessage}
            </Text>

            {bridgingTokenWithHighestBalance && (
              <BridgeTokenButton
                inputToken={bridgingTokenWithHighestBalance.currencyInfo}
                outputToken={nativeCurrencyInfo}
                outputNetworkName={networkName}
              />
            )}

            <BuyNativeTokenButton
              nativeCurrencyInfo={nativeCurrencyInfo}
              canBridge={!!bridgingTokenWithHighestBalance}
            />

            <LearnMoreLink
              textColor="$neutral2"
              textVariant="buttonLabel2"
              url={uniswapUrls.helpArticleUrls.networkFeeInfo}
            />
          </Flex>
        </WarningModal>
      )}
    </>
  )
}
