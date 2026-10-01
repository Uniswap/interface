import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { Flex, type FlexCompatProps, Text, type TextCompatProps } from '@universe/mycelium'
import { type ComponentRef, type CSSProperties, forwardRef } from 'react'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import WarningIcon from 'uniswap/src/components/warnings/WarningIcon'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ElementName, UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { getCurrencyInfoSafetyAnalytics } from 'uniswap/src/features/telemetry/tokenSafetyAnalytics'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { getTokenWarningSeverity } from 'uniswap/src/features/tokens/warnings/safetyUtils'
import { shortenAddress } from 'utilities/src/addresses'
import { NumberType } from 'utilities/src/format/types'
import { MenuItem } from '~/components/SearchModal/styled'
import { MouseoverTooltip, TooltipSize } from '~/components/Tooltip'
import { useTokenBalances } from '~/hooks/useTokenBalances'
import { TokenFromList } from '~/state/lists/tokenFromList'
import { currencyKey } from '~/utils/currencyKey'

function currencyListRowKey(data: Currency): string {
  return currencyKey(data)
}

const TextOverflowStyle: TextCompatProps = {
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

const StyledBalanceText = forwardRef<ComponentRef<typeof Text>, TextCompatProps>(
  function StyledBalanceText(props, ref) {
    return <Text ref={ref} {...TextOverflowStyle} maxWidth="80px" textAlign="right" {...props} />
  },
)

const CurrencyName = forwardRef<ComponentRef<typeof Text>, TextCompatProps>(function CurrencyName(props, ref) {
  return <Text ref={ref} {...TextOverflowStyle} {...props} />
})

const Tag = forwardRef<ComponentRef<typeof Text>, TextCompatProps>(function Tag(props, ref) {
  return (
    <Text
      ref={ref}
      backgroundColor="$surface2"
      color="$neutral2"
      fontSize="14px"
      borderRadius="$rounded4"
      p="$spacing4"
      maxWidth="100px"
      overflow="hidden"
      textOverflow="ellipsis"
      whiteSpace="nowrap"
      alignSelf="flex-end"
      mr="$spacing4"
      {...props}
    />
  )
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

const RowWrapper = forwardRef<ComponentRef<typeof Flex>, FlexCompatProps>(function RowWrapper(props, ref) {
  return <Flex ref={ref} row height="$spacing60" {...props} />
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

  const warningSeverity = getTokenWarningSeverity(currencyInfo)
  const isBlockedToken = warningSeverity === WarningSeverity.Blocked
  const blockedTokenOpacity = '0.6'

  const { balanceMap } = useTokenBalances({ cacheFirst: true })
  const { usdValue, balance: cachedBalance } = balanceMap[currencyKey(currency)] ?? {}
  const tokenBalance = balance ? balance.toExact() : cachedBalance

  const row = (
    // oxlint-disable-next-line react/forbid-elements -- the row needs DOM props (onKeyDown, onClick, tabIndex) for a11y; MenuItem is a compat Flex and doesn't type them
    <div
      role="button"
      tabIndex={0}
      className={`token-item-${key}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          onSelect(warningSeverity === WarningSeverity.None)
        }
      }}
      onClick={() => onSelect(warningSeverity === WarningSeverity.None)}
      style={{ outline: 'none', display: 'contents' }}
    >
      <MenuItem
        onPress={() => onSelect(warningSeverity === WarningSeverity.None)}
        selected={otherSelected || isSelected}
        dim={isBlockedToken}
        disabled={disabled}
      >
        <CurrencyLogo currencyInfo={currencyInfo} size={36} />
        <Flex style={{ opacity: isBlockedToken ? blockedTokenOpacity : '1' }} gap="$spacing2">
          <Flex row alignItems="center" gap="$spacing4">
            <CurrencyName variant="body2">{currency.name}</CurrencyName>
            <WarningIcon severity={warningSeverity} size="$icon.16" ml="$spacing4" />
          </Flex>
          <Flex row alignItems="center" gap="$spacing8">
            <Text variant="body4" ml={0} color="$neutral2">
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
    </div>
  )

  // only show add or remove buttons if not on selected list
  return (
    <Trace
      logPress
      logKeyPress
      eventOnTrigger={UniswapEventName.TokenSelected}
      properties={{ ...eventProperties, ...getCurrencyInfoSafetyAnalytics(currencyInfo), token_balance_usd: usdValue }}
      element={ElementName.TokenSelectorRow}
    >
      {tooltip ? (
        <MouseoverTooltip
          style={style}
          text={
            <Text variant="body4" textAlign="center">
              {tooltip}
            </Text>
          }
          size={TooltipSize.ExtraSmall}
        >
          {row}
        </MouseoverTooltip>
      ) : (
        <RowWrapper style={style}>{row}</RowWrapper>
      )}
    </Trace>
  )
}
