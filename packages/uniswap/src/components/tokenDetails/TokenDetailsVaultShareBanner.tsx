import type { ReactNode } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea, type GetProps, type SpaceTokens } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'

type TextVariant = GetProps<typeof Text>['variant']

type TokenDetailsVaultShareBannerProps = {
  apyPercent: number
  underlyingCurrencyInfo: Maybe<CurrencyInfo>
  /** Whether the user already holds shares of this vault — switches copy to the "manage" variant. */
  hasPosition: boolean
  trailingElement: ReactNode
  onPress?: () => void
  /** Hide the subtitle for the simplified mobile layout. */
  hideSubtitle?: boolean
  /** When set, the frame collapses to a column at small breakpoints (web). */
  responsive?: boolean
  titleVariant?: TextVariant
  subtitleVariant?: TextVariant
  padding?: SpaceTokens
  paddingRight?: SpaceTokens
  iconSize?: number
}

export function TokenDetailsVaultShareBanner({
  apyPercent,
  underlyingCurrencyInfo,
  hasPosition,
  trailingElement,
  onPress,
  hideSubtitle = false,
  responsive = false,
  titleVariant = 'subheading2',
  subtitleVariant = 'body3',
  padding = '$spacing16',
  paddingRight = '$spacing20',
  iconSize = iconSizes.icon40,
}: TokenDetailsVaultShareBannerProps): JSX.Element {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()

  const currency = underlyingCurrencyInfo?.currency
  const symbol = currency?.symbol ?? ''
  const formattedApy = t('explore.earn.apy', { apy: formatPercent(apyPercent) })

  const content = (
    <Flex
      row
      alignItems="center"
      gap="$spacing12"
      width="100%"
      p={padding}
      pr={paddingRight}
      borderRadius="$rounded20"
      backgroundColor="$surface2"
      overflow="hidden"
      {...(responsive ? { $sm: { flexDirection: 'column', alignItems: 'stretch', pr: '$spacing16' } } : {})}
    >
      <Flex row alignItems="center" gap="$spacing12" flex={1} minWidth={0} width="100%">
        <TokenLogo
          hideNetworkLogo
          url={underlyingCurrencyInfo?.logoUrl}
          size={iconSize}
          chainId={currency?.chainId}
          symbol={currency?.symbol}
          name={currency?.name}
        />
        <Flex flex={1} minWidth={0} gap="$spacing2" pr="$spacing24" {...(responsive ? { $sm: { pr: '$none' } } : {})}>
          <Text variant={titleVariant} color="$neutral1">
            {hasPosition ? (
              t('tdp.vaultShareBanner.positionTitle')
            ) : (
              <Trans
                i18nKey="tdp.vaultShareBanner.title"
                values={{ apy: formattedApy, symbol }}
                components={{
                  highlight: <Text tag="span" variant={titleVariant} color="$accent1" />,
                }}
              />
            )}
          </Text>
          {!hideSubtitle && (
            <Text variant={subtitleVariant} color="$neutral2">
              {hasPosition
                ? t('tdp.vaultShareBanner.positionSubtitle', { symbol })
                : t('tdp.vaultShareBanner.subtitle', { symbol })}
            </Text>
          )}
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
