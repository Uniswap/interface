import { Trans } from '@lingui/macro'
import { Currency, Price, Token } from '@uniswap/sdk-core'
import { BlueCard, OutlineCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import HoverInlineText from 'components/HoverInlineText'
import { RowBetween, RowFixed } from 'components/Row'
import { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'

import { StyledInput } from '../styled'

export function SetStartingPrice({
  baseCurrency,
  quoteCurrency,
  price,
  invertPrice,
  startPriceTypedValue,
  onStartPriceInput,
}: {
  noLiquidity?: false
  baseCurrency?: Currency | null
  quoteCurrency?: Currency | null
  price?: Price<Token, Token>
  invertPrice: boolean
  startPriceTypedValue: string
  onStartPriceInput: (typedValue: string) => void
}) {
  const theme = useTheme()
  return (
    <AutoColumn gap="md">
      <RowBetween>
        <ThemedText.DeprecatedLabel>
          <Trans>Set Starting Price</Trans>
        </ThemedText.DeprecatedLabel>
      </RowBetween>
      <BlueCard
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          padding: '1rem 1rem',
        }}
      >
        <ThemedText.DeprecatedBody
          fontSize={14}
          style={{ fontWeight: 500 }}
          textAlign="left"
          color={theme.accentAction}
        >
          <Trans>
            This pool must be initialized before you can add liquidity. To initialize, select a starting price for the
            pool. Then, enter your liquidity price range and deposit amount. Gas fees will be higher than usual due to
            the initialization transaction.
          </Trans>
        </ThemedText.DeprecatedBody>
      </BlueCard>
      <OutlineCard padding="12px">
        <StyledInput className="start-price-input" value={startPriceTypedValue} onUserInput={onStartPriceInput} />
      </OutlineCard>
      <RowBetween style={{ backgroundColor: theme.deprecated_bg1, padding: '12px', borderRadius: '12px' }}>
        <ThemedText.DeprecatedMain>
          <Trans>Current {baseCurrency?.symbol} Price:</Trans>
        </ThemedText.DeprecatedMain>
        <ThemedText.DeprecatedMain>
          {price ? (
            <ThemedText.DeprecatedMain>
              <RowFixed>
                <HoverInlineText
                  maxCharacters={20}
                  text={invertPrice ? price?.invert()?.toSignificant(5) : price?.toSignificant(5)}
                />{' '}
                <span style={{ marginLeft: '4px' }}>{quoteCurrency?.symbol}</span>
              </RowFixed>
            </ThemedText.DeprecatedMain>
          ) : (
            '-'
          )}
        </ThemedText.DeprecatedMain>
      </RowBetween>
    </AutoColumn>
  )
}
