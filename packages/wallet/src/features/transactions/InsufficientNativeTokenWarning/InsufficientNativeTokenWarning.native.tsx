import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { WarningModal } from 'wallet/src/components/modals/WarningModal/WarningModal'
import { InsufficientNativeTokenBaseComponent } from 'wallet/src/features/transactions/InsufficientNativeTokenWarning/InsufficientNativeTokenBaseComponent'
import type { InsufficientNativeTokenWarningProps } from 'wallet/src/features/transactions/InsufficientNativeTokenWarning/InsufficientNativeTokenWarning'
import { useInsufficientNativeTokenWarning } from 'wallet/src/features/transactions/InsufficientNativeTokenWarning/useInsufficientNativeTokenWarning'

export function InsufficientNativeTokenWarning({
  warnings,
  flow,
  gasFee,
}: InsufficientNativeTokenWarningProps): JSX.Element | null {
  const { t } = useTranslation()
  const [showModal, setShowModal] = useState(false)

  const parsedInsufficentNativeTokenWarning = useInsufficientNativeTokenWarning({
    warnings,
    flow,
    gasFee,
  })

  if (!parsedInsufficentNativeTokenWarning) {
    return null
  }

  const { modalOrTooltipMainMessage, nativeCurrency, nativeCurrencyInfo, networkName } =
    parsedInsufficentNativeTokenWarning

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
          <Flex centered gap="$spacing16">
            <Text color="$neutral2" textAlign="center" variant="body3">
              {modalOrTooltipMainMessage}
            </Text>

            <LearnMoreLink url={uniswapUrls.helpArticleUrls.networkFeeInfo} />
          </Flex>
        </WarningModal>
      )}
    </>
  )
}
