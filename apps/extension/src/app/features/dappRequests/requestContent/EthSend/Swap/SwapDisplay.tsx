import { Currency } from '@uniswap/sdk-core'
import { useTranslation } from 'react-i18next'
import { DappRequestContent } from 'src/app/features/dappRequests/DappRequestContent'
import { Flex, Separator, Text } from 'ui/src'
import { ArrowDown } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { WalletChainId } from 'uniswap/src/types/chains'
import { NumberType } from 'utilities/src/format/types'
import { GasFeeResult } from 'wallet/src/features/gas/types'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { useUSDCValue } from 'wallet/src/features/transactions/swap/trade/hooks/useUSDCPrice'
import { ValueType, getCurrencyAmount } from 'wallet/src/utils/getCurrencyAmount'

export function SwapDisplay({
  inputAmount,
  outputAmount,
  inputCurrencyInfo,
  outputCurrencyInfo,
  chainId,
  currencyIn,
  currencyOut,
  transactionGasFeeResult,
  onCancel,
  onConfirm,
  isUniswapX,
}: {
  inputAmount: string
  outputAmount: string
  inputCurrencyInfo: Maybe<CurrencyInfo>
  outputCurrencyInfo: Maybe<CurrencyInfo>
  chainId: WalletChainId | null
  currencyIn?: Currency
  currencyOut?: Currency
  transactionGasFeeResult?: GasFeeResult
  onCancel?: () => Promise<void>
  onConfirm?: () => Promise<void>
  isUniswapX?: boolean
}): JSX.Element {
  const { t } = useTranslation()
  const { formatCurrencyAmount } = useLocalizationContext()

  const inputCurrencyAmount = getCurrencyAmount({
    value: inputAmount,
    valueType: ValueType.Exact,
    currency: inputCurrencyInfo?.currency,
  })
  const inputValue = useUSDCValue(inputCurrencyAmount)

  const outputCurrencyAmount = getCurrencyAmount({
    value: outputAmount,
    valueType: ValueType.Exact,
    currency: outputCurrencyInfo?.currency,
  })
  const outputValue = useUSDCValue(outputCurrencyAmount)

  const showSplitLogo = Boolean(inputCurrencyInfo?.logoUrl && outputCurrencyInfo?.logoUrl)
  const showSwapDetails = Boolean(currencyIn?.symbol && currencyOut?.symbol)

  return (
    <DappRequestContent
      showNetworkCost
      confirmText={t('swap.button.swap')}
      headerIcon={
        showSplitLogo ? (
          <SplitLogo
            chainId={chainId}
            inputCurrencyInfo={inputCurrencyInfo}
            outputCurrencyInfo={outputCurrencyInfo}
            size={iconSizes.icon40}
          />
        ) : undefined
      }
      isUniswapX={isUniswapX}
      title={
        currencyIn?.symbol && currencyOut?.symbol
          ? t('swap.request.title.full', {
              inputCurrencySymbol: currencyIn?.symbol,
              outputCurrencySymbol: currencyOut?.symbol,
            })
          : t('swap.request.title.short')
      }
      transactionGasFeeResult={transactionGasFeeResult}
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      {showSwapDetails && (
        <>
          <Separator />
          <Flex
            alignItems="flex-start"
            flexDirection="column"
            flexGrow={1}
            gap="$spacing12"
            justifyContent="flex-start"
            px="$spacing8"
            py="$spacing16"
          >
            <Flex flexDirection="row" justifyContent="space-between" width="100%">
              <Flex flexDirection="column">
                <Text color="$neutral1" variant="heading3">
                  {formatCurrencyAmount({ value: inputCurrencyAmount, type: NumberType.TokenTx })} {currencyIn?.symbol}
                </Text>
                <Text color="$neutral2" variant="body3">
                  {formatCurrencyAmount({ value: inputValue, type: NumberType.FiatTokenPrice })}
                </Text>
              </Flex>
              <CurrencyLogo currencyInfo={inputCurrencyInfo} />
            </Flex>
            <ArrowDown color="$neutral3" size="$icon.24" />
            <Flex flexDirection="row" justifyContent="space-between" width="100%">
              <Flex flexDirection="column">
                <Text color="$neutral1" variant="heading3">
                  {formatCurrencyAmount({ value: outputCurrencyAmount, type: NumberType.TokenTx })}{' '}
                  {currencyOut?.symbol}
                </Text>
                <Text color="$neutral2" variant="body3">
                  {formatCurrencyAmount({ value: outputValue, type: NumberType.FiatTokenPrice })}
                </Text>
              </Flex>
              <CurrencyLogo currencyInfo={outputCurrencyInfo} />
            </Flex>
          </Flex>
        </>
      )}
    </DappRequestContent>
  )
}
