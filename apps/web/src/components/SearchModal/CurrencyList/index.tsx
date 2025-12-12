import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { MenuItem } from 'components/SearchModal/styled'
import { MouseoverTooltip, TooltipSize } from 'components/Tooltip'
import { useTokenBalances } from 'hooks/useTokenBalances'
import { CSSProperties } from 'react'
import { TokenFromList } from 'state/lists/tokenFromList'
import { ThemedText } from 'theme/components'
import { Flex, styled, Text, TextStyle } from 'ui/src'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import WarningIcon from 'uniswap/src/components/warnings/WarningIcon'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ElementName, UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { getTokenWarningSeverity } from 'uniswap/src/features/tokens/safetyUtils'
import { useDismissedTokenWarnings } from 'uniswap/src/features/tokens/slice/hooks'
import { shortenAddress } from 'utilities/src/addresses'
import { NumberType } from 'utilities/src/format/types'
import { currencyKey } from 'utils/currencyKey'

function currencyListRowKey(data: Currency): string {
  return currencyKey(data)
}

const TextOverflowStyle = {
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
} satisfies TextStyle

const StyledBalanceText = styled(Text, {
  ...TextOverflowStyle,
  maxWidth: '80px',
  textAlign: 'right',
})

const CurrencyName = styled(Text, TextOverflowStyle)

const Tag = styled(Text, {
  backgroundColor: '$surface2',
  color: '$neutral2',
  fontSize: '14px',
  borderRadius: '$rounded4',
  p: '$spacing4',
  maxWidth: '100px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  alignSelf: 'flex-end',
  mr: '$spacing4',
})

function TokenTags({ currency }: { currency: Currency }) {
  if (!(currency instanceof TokenFromList)) {
    return null
  }

  const tags = currency.tags
  if (tags.length === 0) {
    return <span />
  }

  const tag = tags[0]

  return (
    <Flex justifyContent="flex-end">
      <MouseoverTooltip text={tag.description}>
        <Tag key={tag.id}>{tag.name}</Tag>
      </MouseoverTooltip>
      {tags.length > 1 ? (
        <MouseoverTooltip
          text={tags
            .slice(1)
            .map(({ name, description }) => `${name}: ${description}`)
            .join('; \n')}
        >
          <Tag>...</Tag>
        </MouseoverTooltip>
      ) : null}
    </Flex>
  )
}

const RowWrapper = styled(Flex, {
  row: true,
  height: '$spacing60',
})

export function CurrencyRow({
  currencyInfo,
  onSelect,
  isSelected,
  otherSelected,
  style,
  showCurrencyAmount,
  showUsdValue,
  eventProperties,
  balance,
  disabled,
  tooltip,
  showAddress,
}: {
  currencyInfo: CurrencyInfo
  onSelect: (hasWarning: boolean) => void
  isSelected: boolean
  otherSelected: boolean
  style?: CSSProperties
  showCurrencyAmount?: boolean
  showUsdValue?: boolean
  eventProperties: Record<string, unknown>
  balance?: CurrencyAmount<Currency>
  disabled?: boolean
  tooltip?: string
  showAddress?: boolean
}) {
  const { currency } = currencyInfo
  const { convertFiatAmountFormatted, formatNumberOrString } = useLocalizationContext()
  const key = currencyListRowKey(currency)

  const { tokenWarningDismissed: customAdded } = useDismissedTokenWarnings(currency)
  const warningSeverity = getTokenWarningSeverity(currencyInfo)
  const isBlockedToken = warningSeverity === WarningSeverity.Blocked
  const blockedTokenOpacity = '0.6'

  const { balanceMap } = useTokenBalances({ cacheOnly: true })
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const { usdValue, balance: cachedBalance } = balanceMap[currencyKey(currency)] ?? {}
  const tokenBalance = balance ? balance.toExact() : cachedBalance

  const Wrapper = tooltip ? MouseoverTooltip : RowWrapper

  // only show add or remove buttons if not on selected list
  return (
    <Trace
      logPress
      logKeyPress
      eventOnTrigger={UniswapEventName.TokenSelected}
      properties={{ is_imported_by_user: customAdded, ...eventProperties, token_balance_usd: usdValue }}
      element={ElementName.TokenSelectorRow}
    >
      <Wrapper
        style={style}
        text={<ThemedText.Caption textAlign="center">{tooltip}</ThemedText.Caption>}
        size={TooltipSize.ExtraSmall}
      >
        <MenuItem
          tabIndex={0}
          className={`token-item-${key}`}
          onKeyDown={(e) => (e.key === 'Enter' ? onSelect(warningSeverity === WarningSeverity.None) : null)}
          onClick={() => onSelect(warningSeverity === WarningSeverity.None)}
          selected={otherSelected || isSelected}
          dim={isBlockedToken}
          disabled={disabled}
          style={{ outline: 'none' }}
        >
          <CurrencyLogo currency={currency} size={36} style={{ opacity: isBlockedToken ? blockedTokenOpacity : '1' }} />
          <Flex style={{ opacity: isBlockedToken ? blockedTokenOpacity : '1' }} gap="$spacing2">
            <Flex row alignItems="center" gap="$spacing4">
              <CurrencyName variant="body2">{currency.name}</CurrencyName>
              <WarningIcon severity={warningSeverity} size="$icon.16" ml="$spacing4" />
            </Flex>
            <Flex row alignItems="center" gap="$spacing8">
              <Text variant="body4" ml="0px" color="$neutral2">
                {currency.symbol}
              </Text>
              {showAddress && currency.isToken && (
                <Text variant="body4" color="$neutral3">
                  {shortenAddress({ address: currency.address })}
                </Text>
              )}
            </Flex>
          </Flex>
          <Flex>
            <Flex row alignSelf="flex-end">
              <TokenTags currency={currency} />
            </Flex>
          </Flex>
          <Flex alignSelf="center" justifyContent="flex-end">
            {showUsdValue && usdValue ? (
              <StyledBalanceText variant="body4" color="$neutral1">
                {convertFiatAmountFormatted(usdValue, NumberType.FiatStandard)}
              </StyledBalanceText>
            ) : null}
            {showCurrencyAmount && tokenBalance ? (
              <StyledBalanceText variant="body4" color="$neutral2">
                {formatNumberOrString({
                  value: tokenBalance,
                  type: NumberType.TokenNonTx,
                })}
              </StyledBalanceText>
            ) : null}
          </Flex>
        </MenuItem>
      </Wrapper>
    </Trace>
  )
}
