import PROVIDE_LIQUIDITY from 'assets/images/provideLiquidity.png'
import V4_HOOK from 'assets/images/v4Hooks.png'
import Positions from 'pages/Pool/Positions'
import { Navigate } from 'react-router-dom'
import { Anchor, Flex, Text } from 'ui/src'
import { Arrow } from 'ui/src/components/arrow/Arrow'
import { iconSizes } from 'ui/src/theme'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlagWithLoading } from 'uniswap/src/features/gating/hooks'
import { useTranslation } from 'uniswap/src/i18n'

function LearnMoreTile({ img, text, link }: { img: string; text: string; link?: string }) {
  return (
    <Anchor href={link}>
      <Flex
        row
        width={344}
        borderRadius="$rounded20"
        borderColor="$surface3"
        borderWidth={1}
        borderStyle="solid"
        alignItems="center"
        gap="$gap16"
        overflow="hidden"
      >
        <img src={img} style={{ objectFit: 'cover', width: '72px', height: '72px' }} />
        <Text variant="subheading2">{text}</Text>
      </Flex>
    </Anchor>
  )
}

export default function Pool() {
  const { t } = useTranslation()
  const { value: v4Enabled, isLoading } = useFeatureFlagWithLoading(FeatureFlags.V4Everywhere)

  if (!isLoading && !v4Enabled) {
    return <Navigate to="/pools" replace />
  }

  if (isLoading) {
    return null
  }

  return (
    <Flex row $xl={{ flexDirection: 'column' }} maxWidth="$xxl" width="95%" gap={60} mt="$spacing48" mx="$spacing40">
      <Flex grow>
        <Positions />
      </Flex>
      <Flex gap="$gap20" mb="$spacing24">
        <Text variant="subheading1">{t('liquidity.learnMoreLabel')}</Text>
        <Flex gap="$gap12">
          <LearnMoreTile
            img={PROVIDE_LIQUIDITY}
            text={t('liquidity.provideOnProtocols')}
            link={uniswapUrls.helpArticleUrls.providingLiquidityInfo}
          />
          <LearnMoreTile img={V4_HOOK} text={t('liquidity.hooks')} link={uniswapUrls.helpArticleUrls.v4HooksInfo} />
        </Flex>
        <Anchor textDecorationLine="none" href={uniswapUrls.helpArticleUrls.positionsLearnMore} target="_blank">
          <Flex gap="$gap8" alignItems="center" row>
            <Text variant="buttonLabel3" color="$neutral2">
              {t('common.button.learn')}
            </Text>
            <Arrow size={iconSizes.icon20} color="$neutral2" />
          </Flex>
        </Anchor>
      </Flex>
    </Flex>
  )
}
