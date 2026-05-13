import { useTranslation } from 'react-i18next'
import { Flex, Switch, Text } from 'ui/src'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ExternalLink } from '~/theme/components/Links'

export function BuybackAndBurnSection({
  enabled,
  onEnabledChange,
}: {
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
}) {
  const { t } = useTranslation()

  return (
    <Flex row alignItems="flex-start" justifyContent="space-between" gap="$spacing12">
      <Flex flex={1}>
        <Text variant="buttonLabel3" color="$neutral1" height={20} lineHeight={20}>
          {t('toucan.createAuction.step.customizePool.buybackAndBurn')}
        </Text>
        <Text variant="body4" color="$neutral2">
          {t('toucan.createAuction.step.customizePool.buybackAndBurn.description.beforeLink')}
          <ExternalLink
            href={uniswapUrls.helpCenterUrl}
            style={{
              color: 'inherit',
              display: 'inline',
              fontWeight: 500,
              textDecoration: 'underline',
              textUnderlinePosition: 'from-font',
            }}
          >
            {t('toucan.createAuction.step.customizePool.buybackAndBurn.description.link')}
          </ExternalLink>
          .
        </Text>
      </Flex>
      <Switch checked={enabled} variant="default" onCheckedChange={onEnabledChange} />
    </Flex>
  )
}
