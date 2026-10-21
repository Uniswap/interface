import { Flex, Text } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { MARGIN_CHAIN_ID } from '~/constants/margin'

// A before → after row for the action modals. Values identical at display precision collapse to a single
// default-colored value — an arrow between two strings the user cannot tell apart claims a change that
// isn't visible. Risk color lives on the Health row alone (MarginHealthValue); here the prior value is
// dimmed and the current one is neutral. Optional token logos flank the values (Size row). The transition
// folds the arrow into a single aria-label for screen readers; the collapsed form needs none.
export function MarginBeforeAfterRow({
  label,
  before,
  after,
  suffix,
  logos,
}: {
  label: string
  before: string
  after: string
  suffix?: string
  logos?: { url?: string; symbol: string }
}): JSX.Element {
  const { t } = useTranslation()
  const afterText = suffix ? `${after} ${suffix}` : after
  const logo = logos ? (
    <TokenLogo size={16} url={logos.url} symbol={logos.symbol} chainId={MARGIN_CHAIN_ID} hideNetworkLogo />
  ) : null
  // Compare the bare values, never afterText — the suffix rides only on the after side.
  const unchanged = before === after

  return (
    <Flex row justifyContent="space-between" alignItems="center" gap="$spacing12">
      <Text variant="body3" color="$neutral2">
        {label}
      </Text>
      {unchanged ? (
        <Flex row alignItems="center" gap="$spacing6">
          {logo}
          <Text variant="body3" color="$neutral1">
            {afterText}
          </Text>
        </Flex>
      ) : (
        <Flex
          row
          alignItems="center"
          gap="$spacing6"
          aria-label={t('margin.beforeAfter.a11y', { label, before, after: afterText })}
        >
          {logo}
          <Text variant="body3" color="$neutral2">
            {before}
          </Text>
          <Text variant="body3" color="$neutral2">
            →
          </Text>
          {logo}
          <Text variant="body3" color="$neutral1">
            {afterText}
          </Text>
        </Flex>
      )}
    </Flex>
  )
}
