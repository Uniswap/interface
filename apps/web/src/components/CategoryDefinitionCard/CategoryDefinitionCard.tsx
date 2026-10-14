import {
  Flex,
  type FlexProps,
  type IconSizeTokens,
  iconSizes,
  type SpaceTokens,
  Text,
  type TextProps,
  TouchableArea,
  TouchableTextLink,
  type TouchableTextLinkProps,
} from '@universe/mycelium'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { RelativeChange } from 'uniswap/src/components/RelativeChange/RelativeChange'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { getCategoryPileLogos } from 'uniswap/src/features/tokenCategories/getCategoryPileLogos'
import { TokenLogoPile } from 'uniswap/src/features/tokenCategories/TokenLogoPile'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'

/** `popover`: the left-aligned desktop hover card. `sheet`: the centered mobile web bottom-sheet body. */
export type CategoryDefinitionCardLayout = 'popover' | 'sheet'

export interface CategoryDefinitionCardProps {
  category: TokenCategory
  layout: CategoryDefinitionCardLayout
  onPress: () => void
  testID?: string
}

interface LayoutStyle {
  /** Figma hover card text column; the popover container adds its own padding around this. */
  width: FlexProps['width']
  alignItems: FlexProps['alignItems']
  pileGap: SpaceTokens
  nameRowGap: SpaceTokens
  descriptionGap: SpaceTokens
  pileSize: number
  nameVariant: TextProps['variant']
  changeVariant: TextProps['variant']
  arrowSize: IconSizeTokens
  descriptionVariant: TextProps['variant']
  linkVariant: TouchableTextLinkProps['variant']
}

/** TouchableTextLink does not gate propagation, so the link click would otherwise also press the card. */
function stopPropagation(event: { stopPropagation?: () => void }): void {
  event.stopPropagation?.()
}

const LAYOUT_STYLES: Record<CategoryDefinitionCardLayout, LayoutStyle> = {
  popover: {
    width: 217,
    alignItems: 'flex-start',
    pileGap: '$spacing8',
    nameRowGap: '$spacing8',
    descriptionGap: '$spacing4',
    pileSize: iconSizes.icon20,
    nameVariant: 'body3',
    changeVariant: 'body3',
    arrowSize: '$icon.12',
    descriptionVariant: 'body4',
    linkVariant: 'buttonLabel4',
  },
  sheet: {
    width: '100%',
    alignItems: 'center',
    pileGap: '$spacing16',
    nameRowGap: '$spacing8',
    descriptionGap: '$spacing8',
    pileSize: iconSizes.icon32,
    nameVariant: 'subheading1',
    changeVariant: 'body2',
    arrowSize: '$icon.20',
    descriptionVariant: 'body2',
    linkVariant: 'buttonLabel2',
  },
}

/** Content only: the popover or sheet container owns chrome, fetching, and navigation. */
export const CategoryDefinitionCard = memo(function CategoryDefinitionCard({
  category,
  layout,
  onPress,
  testID,
}: CategoryDefinitionCardProps): JSX.Element {
  const { t } = useTranslation()
  const style = LAYOUT_STYLES[layout]
  const centered = style.alignItems === 'center'
  const pileLogos = getCategoryPileLogos(category)

  return (
    <TouchableArea
      alignItems={style.alignItems}
      gap={style.pileGap}
      testID={testID}
      width={style.width}
      onPress={onPress}
    >
      {pileLogos.length > 0 && <TokenLogoPile logos={pileLogos} size={style.pileSize} />}
      <Flex alignItems={style.alignItems} gap={style.nameRowGap} width="100%">
        <Flex row alignItems="center" gap={style.nameRowGap}>
          <Text color="$neutral1" variant={style.nameVariant}>
            {category.name}
          </Text>
          {category.stats !== undefined && (
            <RelativeChange
              arrowSize={style.arrowSize}
              change={category.stats.priceChange24hPct}
              variant={style.changeVariant}
            />
          )}
        </Flex>
        <Flex alignItems={style.alignItems} gap={style.descriptionGap} width="100%">
          <Text color="$neutral2" textAlign={centered ? 'center' : undefined} variant={style.descriptionVariant}>
            {category.description}
          </Text>
          <TouchableTextLink
            color="$neutral1"
            link={UniswapHelpUrls.articles.tokenCategoryDefinitions}
            variant={style.linkVariant}
            onPress={stopPropagation}
          >
            {t('common.button.learn')}
          </TouchableTextLink>
        </Flex>
      </Flex>
    </TouchableArea>
  )
})
