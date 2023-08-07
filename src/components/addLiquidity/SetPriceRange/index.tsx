import { Trans } from '@lingui/macro'
import { Currency, Price, Token } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { YellowCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import HoverInlineText from 'components/HoverInlineText'
import LiquidityChartRangeInput from 'components/LiquidityChartRangeInput'
import RangeSelector from 'components/RangeSelector'
import PresetsButtons from 'components/RangeSelector/PresetsButtons'
import RateToggle from 'components/RateToggle'
import Row, { AutoRow, RowBetween, RowFixed } from 'components/Row'
import { AlertTriangle } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { Field } from 'state/burn/actions'
import { Bound } from 'state/mint/v3/actions'
import { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'

export function SetPriceRange({
  baseCurrency,
  quoteCurrency,
  currencyIdA,
  currencyIdB,
  formattedAmounts,
  price,
  priceLower,
  priceUpper,
  invertPrice,
  feeAmount,
  ticksAtLimit,
  outOfRange,
  invalidRange,
  showChart,
  interactiveChart,
  onFieldAInput,
  onLeftRangeInput,
  onRightRangeInput,
  getDecrementLower,
  getIncrementLower,
  getDecrementUpper,
  getIncrementUpper,
  handleSetFullRange,
}: {
  baseCurrency?: Currency | null
  quoteCurrency?: Currency | null
  currencyIdA?: string
  currencyIdB?: string
  formattedAmounts: { [x: string]: string }
  price?: Price<Token, Token>
  priceLower?: Price<Token, Token>
  priceUpper?: Price<Token, Token>
  invertPrice: boolean
  feeAmount?: FeeAmount
  ticksAtLimit: {
    LOWER?: boolean
    UPPER?: boolean
  }
  outOfRange: boolean
  invalidRange: boolean
  showChart: boolean
  interactiveChart: boolean
  onFieldAInput: (typedValue: string) => void
  onLeftRangeInput: (typedValue: string) => void
  onRightRangeInput: (typedValue: string) => void
  getDecrementLower: () => string
  getIncrementLower: () => string
  getDecrementUpper: () => string
  getIncrementUpper: () => string
  handleSetFullRange: () => void
}) {
  const theme = useTheme()
  const navigate = useNavigate()
  return (
    <AutoColumn gap="md">
      <RowBetween>
        <ThemedText.DeprecatedLabel>
          <Trans>Set Price Range</Trans>
        </ThemedText.DeprecatedLabel>
        {Boolean(baseCurrency && quoteCurrency) && (
          <RowFixed gap="8px">
            <PresetsButtons onSetFullRange={handleSetFullRange} />
            <RateToggle
              currencyA={baseCurrency as Currency}
              currencyB={quoteCurrency as Currency}
              handleRateToggle={() => {
                if (!ticksAtLimit[Bound.LOWER] && !ticksAtLimit[Bound.UPPER]) {
                  onLeftRangeInput((invertPrice ? priceLower : priceUpper?.invert())?.toSignificant(6) ?? '')
                  onRightRangeInput((invertPrice ? priceUpper : priceLower?.invert())?.toSignificant(6) ?? '')
                  onFieldAInput(formattedAmounts[Field.CURRENCY_B] ?? '')
                }
                navigate(`/add/${currencyIdB as string}/${currencyIdA as string}${feeAmount ? '/' + feeAmount : ''}`)
              }}
            />
          </RowFixed>
        )}
      </RowBetween>
      <RangeSelector
        priceLower={priceLower}
        priceUpper={priceUpper}
        getDecrementLower={getDecrementLower}
        getIncrementLower={getIncrementLower}
        getDecrementUpper={getDecrementUpper}
        getIncrementUpper={getIncrementUpper}
        onLeftRangeInput={onLeftRangeInput}
        onRightRangeInput={onRightRangeInput}
        currencyA={baseCurrency}
        currencyB={quoteCurrency}
        feeAmount={feeAmount}
        ticksAtLimit={ticksAtLimit}
      />
      {outOfRange ? (
        <YellowCard padding="8px 12px" $borderRadius="12px">
          <Row>
            <AlertTriangle stroke={theme.deprecated_yellow3} size="16px" />
            <ThemedText.DeprecatedYellow ml="12px" fontSize="12px">
              <Trans>
                Your position will not earn fees or be used in trades until the market price moves into your range.
              </Trans>
            </ThemedText.DeprecatedYellow>
          </Row>
        </YellowCard>
      ) : null}

      {invalidRange ? (
        <YellowCard padding="8px 12px" $borderRadius="12px">
          <Row>
            <AlertTriangle stroke={theme.deprecated_yellow3} size="16px" />
            <ThemedText.DeprecatedYellow ml="12px" fontSize="12px" justifySelf="start">
              <Trans>Invalid range selected. The min price must be lower than the max price.</Trans>
            </ThemedText.DeprecatedYellow>
          </Row>
        </YellowCard>
      ) : null}
      {price && baseCurrency && quoteCurrency && showChart && (
        <AutoColumn gap="md">
          <AutoRow gap="4px" justify="center" style={{ marginTop: '2rem' }}>
            <Trans>
              <ThemedText.DeprecatedMain fontWeight={500} textAlign="center" fontSize={12} color="text1">
                Current Price:
              </ThemedText.DeprecatedMain>
              <ThemedText.DeprecatedBody fontWeight={500} textAlign="center" fontSize={12} color="text1">
                <HoverInlineText
                  maxCharacters={20}
                  text={invertPrice ? price.invert().toSignificant(6) : price.toSignificant(6)}
                />
              </ThemedText.DeprecatedBody>
              <ThemedText.DeprecatedBody color="text2" fontSize={12}>
                {quoteCurrency?.symbol} per {baseCurrency.symbol}
              </ThemedText.DeprecatedBody>
            </Trans>
          </AutoRow>
          <LiquidityChartRangeInput
            currencyA={baseCurrency ?? undefined}
            currencyB={quoteCurrency ?? undefined}
            feeAmount={feeAmount}
            ticksAtLimit={ticksAtLimit}
            price={price ? parseFloat((invertPrice ? price.invert() : price).toSignificant(8)) : undefined}
            priceLower={priceLower}
            priceUpper={priceUpper}
            onLeftRangeInput={onLeftRangeInput}
            onRightRangeInput={onRightRangeInput}
            interactive={interactiveChart}
          />
        </AutoColumn>
      )}
    </AutoColumn>
  )
}
