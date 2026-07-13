import { useTranslation } from 'react-i18next'
import { Flex, Switch, Text, useMedia } from 'ui/src'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { ExternalLink } from '~/theme/components/Links'

export function BuybackAndBurnSection({
  controlColumnWidthPx,
  enabled,
  onEnabledChange,
}: {
  controlColumnWidthPx: number
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
}) {
  const { t } = useTranslation()
  const media = useMedia()
  /** Same breakpoint as `SendFeesToAddressSection` (`stackInputBelow`). */
  const stackInputBelow = Boolean(media.md)

  return (
    <Flex gap="$spacing8">
      <Flex row alignItems="flex-start" gap="$spacing16" flexWrap="nowrap" width="100%">
        <Flex flex={1} flexShrink={1} minWidth={0}>
          <Text variant="buttonLabel3" color="$neutral1" height={20} lineHeight={20}>
            {t('toucan.createAuction.step.customizePool.buybackAndBurn')}
          </Text>
          <Text variant="body4" color="$neutral2">
            {t('toucan.createAuction.step.customizePool.buybackAndBurn.description.beforeLink')}
            <ExternalLink
              href={UniswapHelpUrls.articles.toucanLaunchAuctionCustomizePoolHelp}
              style={{
                color: 'inherit',
                display: 'inline',
                fontSize: 'inherit',
                fontWeight: 500,
                lineHeight: 'inherit',
                textDecoration: 'underline',
                textUnderlinePosition: 'from-font',
              }}
            >
              {t('toucan.createAuction.step.customizePool.buybackAndBurn.description.link')}
            </ExternalLink>
            .
          </Text>
        </Flex>
        <Flex
          flexShrink={0}
          {...(stackInputBelow ? {} : { width: controlColumnWidthPx, maxWidth: '100%' as const })}
          alignItems="flex-end"
        >
          <Switch checked={enabled} variant="default" onCheckedChange={onEnabledChange} />
        </Flex>
      </Flex>
    </Flex>
  )
}
