import { useTranslation } from 'react-i18next'
import { Anchor, Flex, Text } from 'ui/src'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import PROVIDE_LIQUIDITY from '~/assets/images/provideLiquidity.png'
import V4_HOOK from '~/assets/images/v4Hooks.png'
import { ClickableTamaguiStyle } from '~/theme/components/styles'

export function LearnMoreTile({
  img,
  text,
  link,
  width = 344,
}: {
  img: string
  text: string
  link?: string
  width?: number | string
}) {
  return (
    <Anchor
      href={link}
      textDecorationLine="none"
      target="_blank"
      rel="noopener noreferrer"
      width={width}
      {...ClickableTamaguiStyle}
      hoverStyle={{ backgroundColor: '$surface1Hovered', borderColor: '$surface3Hovered' }}
    >
      <Flex
        row
        borderRadius="$rounded20"
        borderColor="$surface3"
        borderWidth="$spacing1"
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

export function LiquidityLearnMoreTiles() {
  const { t } = useTranslation()

  return (
    <Flex gap="$gap20" mb="$spacing24">
      <Flex row gap="$gap12" $sm={{ flexDirection: 'column' }}>
        <LearnMoreTile
          width="100%"
          img={PROVIDE_LIQUIDITY}
          text={t('liquidity.provideOnProtocols')}
          link={UniswapHelpUrls.articles.providingLiquidityInfo}
        />
        <LearnMoreTile
          width="100%"
          img={V4_HOOK}
          text={t('liquidity.hooks')}
          link={UniswapHelpUrls.articles.v4HooksInfo}
        />
      </Flex>
    </Flex>
  )
}
