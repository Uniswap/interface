import Row from 'components/Row'
import { Trait } from 'nft/types'
import styled from 'styled-components/macro'
import { colors } from 'theme/colors'

const RarityBar = styled.div<{ $color?: string }>`
  background: ${({ $color, theme }) => $color ?? theme.backgroundOutline};
  width: 2px;
  height: 10px;
  border-radius: 2px;
`

interface RarityValue {
  threshold: number
  color: string
}

enum RarityLevel {
  VeryCommon = 'Very Common',
  Common = 'Common',
  Rare = 'Rare',
  VeryRare = 'Very Rare',
  ExtremelyRare = 'Extremely Rare',
}

const RarityLevels: { [key in RarityLevel]: RarityValue } = {
  [RarityLevel.VeryCommon]: {
    threshold: 0.8,
    color: colors.gray500,
  },
  [RarityLevel.Common]: {
    threshold: 0.6,
    color: colors.green300,
  },
  [RarityLevel.Rare]: {
    threshold: 0.4,
    color: colors.blueVibrant,
  },
  [RarityLevel.VeryRare]: {
    threshold: 0.2,
    color: colors.purpleVibrant,
  },
  [RarityLevel.ExtremelyRare]: {
    threshold: 0,
    color: colors.magentaVibrant,
  },
}

function getRarityLevel(rarity: number) {
  switch (true) {
    case rarity > RarityLevels[RarityLevel.VeryCommon].threshold:
      return RarityLevels[RarityLevel.VeryCommon]
    case rarity > RarityLevels[RarityLevel.Common].threshold:
      return RarityLevels[RarityLevel.Common]
    case rarity > RarityLevels[RarityLevel.Rare].threshold:
      return RarityLevels[RarityLevel.Rare]
    case rarity > RarityLevels[RarityLevel.VeryRare].threshold:
      return RarityLevels[RarityLevel.VeryRare]
    case rarity >= RarityLevels[RarityLevel.ExtremelyRare].threshold:
      return RarityLevels[RarityLevel.ExtremelyRare]
    default:
      return RarityLevels[RarityLevel.VeryCommon]
  }
}

export const RarityGraph = ({ trait, rarity }: { trait: Trait; rarity: number }) => {
  const rarityLevel = getRarityLevel(rarity)
  return (
    <Row gap="1.68px" justify="flex-end">
      {Array.from({ length: 20 }).map((_, index) => (
        <RarityBar
          key={trait.trait_value + '_bar_' + index}
          $color={index * 0.05 <= 1 - rarity ? rarityLevel?.color : undefined}
        />
      ))}
    </Row>
  )
}
