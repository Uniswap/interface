import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Button, Flex, Text, useShadowPropsMedium } from 'ui/src'
import { EarnSparkle } from 'ui/src/components/icons/EarnSparkle'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { EarnVaultModal } from '~/features/earn/EarnVaultModal'
import type { TokenDetailsEarnData } from '~/pages/TokenDetails/components/earn/useTokenDetailsEarnData'

type TokenDetailsEarnBannerProps = {
  earnData: TokenDetailsEarnData
}

export function TokenDetailsEarnBanner({ earnData }: TokenDetailsEarnBannerProps): JSX.Element | null {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted, formatPercent } = useLocalizationContext()
  const shadowProps = useShadowPropsMedium()
  const [selectedVault, setSelectedVault] = useState<EarnVaultInfo | null>(null)
  const {
    balanceUsd,
    earnVault,
    hasLoadedPositions,
    isLoggedIn,
    projectedAnnualEarningsUsd,
    tokenSymbol,
    userHasEarnPosition,
  } = earnData

  if (!isLoggedIn || !earnVault || !hasLoadedPositions || userHasEarnPosition) {
    return null
  }

  const hasProjectedEarnings = balanceUsd !== undefined && balanceUsd > 0
  const formattedApy = t('explore.earn.apy', { apy: formatPercent(earnVault.apyPercent) })
  const formattedAnnualEarnings = hasProjectedEarnings
    ? convertFiatAmountFormatted(projectedAnnualEarningsUsd ?? 0, NumberType.PortfolioBalance)
    : undefined

  return (
    <>
      <Flex
        row
        alignItems="center"
        gap="$spacing12"
        width="100%"
        p="$spacing16"
        pr="$spacing20"
        borderWidth="$spacing1"
        borderColor="$surface3"
        borderRadius="$rounded20"
        backgroundColor="$surface1"
        overflow="hidden"
        {...shadowProps}
        $sm={{ flexDirection: 'column', alignItems: 'stretch', pr: '$spacing16' }}
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
          <Flex flex={1} minWidth={0} gap="$spacing2" pr="$spacing24" $sm={{ pr: '$none' }}>
            <Text variant="subheading2" color="$neutral1">
              <Trans
                i18nKey="tdp.earnBanner.title"
                values={{ apy: formattedApy, symbol: tokenSymbol }}
                components={{
                  highlight: <Text tag="span" variant="subheading2" color="$accent1" />,
                }}
              />
            </Text>
            <Text variant="body3" color="$neutral2">
              {hasProjectedEarnings ? (
                <Trans
                  i18nKey="tdp.earnBanner.subtitleWithEarnings"
                  values={{ amount: formattedAnnualEarnings }}
                  components={{
                    highlight: <Text tag="span" variant="body3" color="$statusSuccess" />,
                  }}
                />
              ) : (
                t('tdp.earnBanner.subtitle')
              )}
            </Text>
          </Flex>
        </Flex>
        <Button
          size="small"
          variant="branded"
          fill={false}
          onPress={() => setSelectedVault(earnVault)}
          $sm={{ width: '100%' }}
        >
          {t('common.getStarted')}
        </Button>
      </Flex>
      <EarnVaultModal vault={selectedVault} isOpen={selectedVault !== null} onClose={() => setSelectedVault(null)} />
    </>
  )
}
