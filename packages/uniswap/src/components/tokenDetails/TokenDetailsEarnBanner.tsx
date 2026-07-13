import type { ReactNode } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea, useShadowPropsMedium, type GetProps, type SpaceTokens } from 'ui/src'
import { EarnSparkle } from 'ui/src/components/icons/EarnSparkle'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'

type TextVariant = GetProps<typeof Text>['variant']

type TokenDetailsEarnBannerProps = {
  apyPercent: number
  tokenSymbol: string
  balanceUsd: number | undefined
  projectedAnnualEarningsUsd: number | undefined
  trailingElement: ReactNode
  onPress?: () => void
  titleVariant?: TextVariant
  subtitleVariant?: TextVariant
  padding?: SpaceTokens
  paddingRight?: SpaceTokens
  /** When set, the frame collapses to a column at small breakpoints (web). */
  responsive?: boolean
  /** Use the shorter "Earn up to ... /yr" subtitle copy instead of the default. */
  shortSubtitle?: boolean
}

export function TokenDetailsEarnBanner({
  apyPercent,
  tokenSymbol,
  balanceUsd,
  projectedAnnualEarningsUsd,
  trailingElement,
  onPress,
  titleVariant = 'subheading2',
  subtitleVariant = 'body3',
  padding = '$spacing16',
  paddingRight = '$spacing20',
  responsive = false,
  shortSubtitle = false,
}: TokenDetailsEarnBannerProps): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted, formatPercent } = useLocalizationContext()
  const shadowProps = useShadowPropsMedium()

  const hasProjectedEarnings = balanceUsd !== undefined && balanceUsd > 0
  const formattedApy = t('explore.earn.apy', { apy: formatPercent(apyPercent) })
  const formattedAnnualEarnings = hasProjectedEarnings
    ? convertFiatAmountFormatted(projectedAnnualEarningsUsd ?? 0, NumberType.PortfolioBalance)
    : undefined

  const content = (
    <Flex
      row
      alignItems="center"
      gap="$spacing12"
      width="100%"
      p={padding}
      pr={paddingRight}
      borderWidth="$spacing1"
      borderColor="$surface3"
      borderRadius="$rounded20"
      backgroundColor="$surface1"
      overflow="hidden"
      {...shadowProps}
      {...(responsive ? { $sm: { flexDirection: 'column', alignItems: 'stretch', pr: '$spacing16' } } : {})}
    >
      <Flex row alignItems="center" gap="$spacing12" flex={1} minWidth={0} width="100%">
        <Flex
          centered
          width="$spacing40"
          height="$spacing40"
          borderRadius="$rounded12"
          backgroundColor="$accent2"
          flexShrink={0}
        >
          <EarnSparkle color="$accent1" size="$icon.24" />
        </Flex>
        <Flex flex={1} minWidth={0} gap="$spacing2" pr="$spacing24" {...(responsive ? { $sm: { pr: '$none' } } : {})}>
          <Text variant={titleVariant} color="$neutral1">
            <Trans
              i18nKey="tdp.earnBanner.title"
              values={{ apy: formattedApy, symbol: tokenSymbol }}
              components={{
                highlight: <Text tag="span" variant={titleVariant} color="$accent1" />,
              }}
            />
          </Text>
          <Text variant={subtitleVariant} color="$neutral2">
            {hasProjectedEarnings ? (
              shortSubtitle ? (
                <Trans
                  i18nKey="tdp.earnBanner.subtitleWithEarningsShort"
                  values={{ amount: formattedAnnualEarnings }}
                  components={{
                    highlight: <Text tag="span" variant={subtitleVariant} color="$statusSuccess" />,
                  }}
                />
              ) : (
                <Trans
                  i18nKey="tdp.earnBanner.subtitleWithEarnings"
                  values={{ amount: formattedAnnualEarnings }}
                  components={{
                    highlight: <Text tag="span" variant={subtitleVariant} color="$statusSuccess" />,
                  }}
                />
              )
            ) : (
              t('tdp.earnBanner.subtitle')
            )}
          </Text>
        </Flex>
      </Flex>
      {trailingElement}
    </Flex>
  )

  if (!onPress) {
    return content
  }

  return (
    <TouchableArea borderRadius="$rounded20" onPress={onPress}>
      {content}
    </TouchableArea>
  )
}
