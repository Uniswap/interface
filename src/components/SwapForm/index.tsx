import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useEffect, useMemo, useState } from 'react'
import { Box, Flex } from 'rebass'
import { parseGetRouteResponse } from 'services/route/utils'

import AddressInputPanel from 'components/AddressInputPanel'
import { AutoRow } from 'components/Row'
import InputCurrencyPanel from 'components/SwapForm/InputCurrencyPanel'
import OutputCurrencyPanel from 'components/SwapForm/OutputCurrencyPanel'
import { SwapFormContextProvider } from 'components/SwapForm/SwapFormContext'
import useBuildRoute from 'components/SwapForm/hooks/useBuildRoute'
import useGetInputError from 'components/SwapForm/hooks/useGetInputError'
import useGetRoute from 'components/SwapForm/hooks/useGetRoute'
import useParsedAmount from 'components/SwapForm/hooks/useParsedAmount'
import TrendingSoonTokenBanner from 'components/TrendingSoonTokenBanner'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import TradePrice from 'components/swapv2/TradePrice'
import { Wrapper } from 'components/swapv2/styleds'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import useWrapCallback, { WrapType } from 'hooks/useWrapCallback'
import { ClickableText } from 'pages/Pool/styleds'
import { DetailedRouteSummary, FeeConfig } from 'types/route'

import PriceImpactNote from './PriceImpactNote'
import RefreshButton from './RefreshButton'
import ReverseTokenSelectionButton from './ReverseTokenSelectionButton'
import SwapActionButton from './SwapActionButton'
import TradeSummary from './TradeSummary'
import TradeTypeSelection from './TradeTypeSelection'

export type SwapFormProps = {
  hidden: boolean

  currencyIn: Currency | undefined
  currencyOut: Currency | undefined

  balanceIn: CurrencyAmount<Currency> | undefined
  balanceOut: CurrencyAmount<Currency> | undefined

  routeSummary: DetailedRouteSummary | undefined
  setRouteSummary: React.Dispatch<React.SetStateAction<DetailedRouteSummary | undefined>>

  isAdvancedMode: boolean
  slippage: number
  feeConfig: FeeConfig | undefined
  transactionTimeout: number

  onChangeCurrencyIn: (c: Currency) => void
  onChangeCurrencyOut: (c: Currency) => void
  goToSettingsView: () => void
}

const SwapForm: React.FC<SwapFormProps> = props => {
  const {
    hidden,
    currencyIn,
    currencyOut,
    balanceIn,
    balanceOut,
    setRouteSummary,
    isAdvancedMode,
    slippage,
    feeConfig,
    transactionTimeout,
    onChangeCurrencyIn,
    onChangeCurrencyOut,
    goToSettingsView,
  } = props

  const { chainId, isEVM, isSolana } = useActiveWeb3React()

  const theme = useTheme()
  const [isProcessingSwap, setProcessingSwap] = useState(false)
  const [typedValue, setTypedValue] = useState('1')
  const [recipient, setRecipient] = useState<string | null>(null)
  const [isSaveGas, setSaveGas] = useState(false)

  const parsedAmount = useParsedAmount(currencyIn, typedValue)
  const { wrapType, inputError: wrapInputError, execute: onWrap } = useWrapCallback(currencyIn, currencyOut, typedValue)
  const isWrapOrUnwrap = wrapType !== WrapType.NOT_APPLICABLE

  const { fetcher: getRoute, result } = useGetRoute({
    currencyIn,
    currencyOut,
    feeConfig,
    isSaveGas,
    parsedAmount,
  })

  const { data: getRouteRawResponse, isFetching: isGettingRoute, error: getRouteError } = result
  const getRouteResponse = useMemo(() => {
    if (!getRouteRawResponse?.data || getRouteError || !currencyIn || !currencyOut) {
      return undefined
    }

    return parseGetRouteResponse(getRouteRawResponse.data, currencyIn, currencyOut)
  }, [currencyIn, currencyOut, getRouteError, getRouteRawResponse])

  const routeSummary = getRouteResponse?.routeSummary

  const buildRoute = useBuildRoute({
    recipient: isAdvancedMode && recipient ? recipient : '',
    routeSummary: getRouteRawResponse?.data?.routeSummary || undefined,
    slippage,
    transactionTimeout,
    skipSimulateTx: isAdvancedMode,
  })

  const swapInputError = useGetInputError({
    currencyIn,
    currencyOut,
    typedValue,
    recipient,
    balanceIn,
    parsedAmountFromTypedValue: parsedAmount,
  })

  const handleChangeCurrencyIn = (c: Currency) => {
    setRouteSummary(undefined)
    onChangeCurrencyIn(c)
  }

  const handleChangeCurrencyOut = (c: Currency) => {
    setRouteSummary(undefined)
    onChangeCurrencyOut(c)
  }

  const isSolanaUnwrap = isSolana && wrapType === WrapType.UNWRAP
  useEffect(() => {
    // reset value for unwrapping WSOL
    // because on Solana, unwrap WSOL is closing WSOL account,
    // which mean it will unwrap all WSOL at once and we can't unwrap partial amount of WSOL
    if (isSolanaUnwrap) setTypedValue(balanceIn?.toExact() ?? '')
  }, [balanceIn, isSolanaUnwrap])

  useEffect(() => {
    setRouteSummary(routeSummary)
  }, [routeSummary, setRouteSummary])

  return (
    <SwapFormContextProvider
      feeConfig={feeConfig}
      slippage={slippage}
      routeSummary={routeSummary}
      typedValue={typedValue}
      isSaveGas={isSaveGas}
      recipient={recipient}
    >
      <Box sx={{ flexDirection: 'column', gap: '16px', display: hidden ? 'none' : 'flex' }}>
        <Wrapper id={TutorialIds.SWAP_FORM_CONTENT}>
          <Flex flexDirection="column" sx={{ gap: '0.75rem' }}>
            <InputCurrencyPanel
              wrapType={wrapType}
              typedValue={typedValue}
              setTypedValue={setTypedValue}
              currencyIn={currencyIn}
              currencyOut={currencyOut}
              balanceIn={balanceIn}
              onChangeCurrencyIn={handleChangeCurrencyIn}
            />

            <AutoRow justify="space-between">
              <Flex alignItems="center">
                {!isWrapOrUnwrap && (
                  <>
                    <RefreshButton
                      shouldDisable={!parsedAmount || parsedAmount.equalTo(0) || isProcessingSwap}
                      callback={getRoute}
                    />
                    <TradePrice price={routeSummary?.executionPrice} />
                  </>
                )}
              </Flex>

              <ReverseTokenSelectionButton onClick={() => currencyIn && handleChangeCurrencyOut(currencyIn)} />
            </AutoRow>

            <OutputCurrencyPanel
              wrapType={wrapType}
              parsedAmountIn={parsedAmount}
              parsedAmountOut={routeSummary?.parsedAmountOut}
              currencyIn={currencyIn}
              currencyOut={currencyOut}
              amountOutUsd={routeSummary?.amountOutUsd}
              onChangeCurrencyOut={handleChangeCurrencyOut}
            />

            {isAdvancedMode && isEVM && !isWrapOrUnwrap && (
              <AddressInputPanel id="recipient" value={recipient} onChange={setRecipient} />
            )}

            {!isWrapOrUnwrap && (
              <Flex
                alignItems="center"
                fontSize={12}
                color={theme.subText}
                onClick={goToSettingsView}
                width="fit-content"
              >
                <ClickableText color={theme.subText} fontWeight={500}>
                  <Trans>Max Slippage:</Trans>&nbsp;
                  {slippage / 100}%
                </ClickableText>
              </Flex>
            )}
          </Flex>
        </Wrapper>
        <Flex flexDirection="column" style={{ gap: '1.25rem' }}>
          <TradeTypeSelection isSaveGas={isSaveGas} setSaveGas={setSaveGas} />

          {chainId !== ChainId.ETHW && (
            <TrendingSoonTokenBanner currencyIn={currencyIn} currencyOut={currencyOut} style={{ marginTop: '24px' }} />
          )}

          <PriceImpactNote
            priceImpact={routeSummary?.priceImpact}
            isAdvancedMode={isAdvancedMode}
            hasTooltip
            style={{
              marginTop: '28px',
            }}
          />

          <SwapActionButton
            isGettingRoute={isGettingRoute}
            parsedAmountFromTypedValue={parsedAmount}
            balanceIn={balanceIn}
            balanceOut={balanceOut}
            isAdvancedMode={isAdvancedMode}
            typedValue={typedValue}
            currencyIn={currencyIn}
            currencyOut={currencyOut}
            wrapInputError={wrapInputError}
            wrapType={wrapType}
            routeSummary={routeSummary}
            isProcessingSwap={isProcessingSwap}
            setProcessingSwap={setProcessingSwap}
            onWrap={onWrap}
            buildRoute={buildRoute}
            swapInputError={swapInputError}
          />

          <TradeSummary feeConfig={feeConfig} routeSummary={routeSummary} slippage={slippage} />
        </Flex>
      </Box>
    </SwapFormContextProvider>
  )
}

export default SwapForm
