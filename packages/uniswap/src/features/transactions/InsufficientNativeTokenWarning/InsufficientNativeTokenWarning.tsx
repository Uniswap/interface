import { Currency } from '@uniswap/sdk-core'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { Warning } from 'uniswap/src/components/modals/WarningModal/types'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { useBridgingTokenWithHighestBalance } from 'uniswap/src/features/bridging/hooks/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { BridgeTokenButton } from 'uniswap/src/features/transactions/InsufficientNativeTokenWarning/BridgeTokenButton'
import { BuyNativeTokenButton } from 'uniswap/src/features/transactions/InsufficientNativeTokenWarning/BuyNativeTokenButton'
import { InsufficientNativeTokenBaseComponent } from 'uniswap/src/features/transactions/InsufficientNativeTokenWarning/InsufficientNativeTokenBaseComponent'
import { useInsufficientNativeTokenWarning } from 'uniswap/src/features/transactions/InsufficientNativeTokenWarning/useInsufficientNativeTokenWarning'
import { currencyIdToAddress } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'

export function InsufficientNativeTokenWarning({
  warnings,
  flow,
  gasFee,
}: {
  warnings: Warning[]
  flow: 'send' | 'swap'
  gasFee: GasFeeResult
}): JSX.Element | null {
  const parsedInsufficentNativeTokenWarning = useInsufficientNativeTokenWarning({
    warnings,
    flow,
    gasFee,
  })

  const { nativeCurrency, nativeCurrencyInfo } = parsedInsufficentNativeTokenWarning ?? {}

  const address = useAccountMeta()?.address

  if (!parsedInsufficentNativeTokenWarning || !nativeCurrencyInfo || !nativeCurrency) {
    return null
  }

  if (!address) {
    logger.error(new Error('Unexpected render of `InsufficientNativeTokenWarning` without an active address'), {
      tags: {
        file: 'InsufficientNativeTokenWarning.tsx',
        function: 'InsufficientNativeTokenWarning',
      },
    })
    return null
  }

  return (
    <InsufficientNativeTokenWarningContent
      address={address}
      parsedInsufficentNativeTokenWarning={parsedInsufficentNativeTokenWarning}
      nativeCurrencyInfo={nativeCurrencyInfo}
      nativeCurrency={nativeCurrency}
    />
  )
}

function InsufficientNativeTokenWarningContent({
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

  const onClose = (): void => {
    setShowModal(false)
  }

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
                  // FIXME: Verify WALL-5906
                  tokenSymbol: nativeCurrency.symbol ?? '',
                  networkName,
                })
              : t('transaction.warning.insufficientGas.modal.title.withoutNetwork', {
                  // FIXME: Verify WALL-5906
                  tokenSymbol: nativeCurrency.symbol ?? '',
                })
          }
          onClose={onClose}
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
                onPress={onClose}
              />
            )}

            <BuyNativeTokenButton
              nativeCurrencyInfo={nativeCurrencyInfo}
              canBridge={!!bridgingTokenWithHighestBalance}
              onPress={onClose}
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
