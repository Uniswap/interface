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

const RarityLevels: Map<string, RarityValue> = new Map([
  [
    RarityLevel.VeryCommon,
    {
      threshold: 0.8,
      color: colors.gray500,
    },
  ],
  [
    RarityLevel.Common,
    {
      threshold: 0.6,
      color: colors.green300,
    },
  ],
  [
    RarityLevel.Rare,
    {
      threshold: 0.4,
      color: colors.blueVibrant,
    },
  ],
  [
    RarityLevel.VeryRare,
    {
      threshold: 0.2,
      color: colors.purpleVibrant,
    },
  ],
  [
    RarityLevel.ExtremelyRare,
    {
      threshold: 0,
      color: colors.magentaVibrant,
    },
  ],
])

function getRarityLevel(rarity: number) {
  switch (true) {
    case rarity > (RarityLevels.get(RarityLevel.VeryCommon)?.threshold ?? Number.MAX_SAFE_INTEGER):
      return RarityLevels.get(RarityLevel.VeryCommon)
    case rarity > (RarityLevels.get(RarityLevel.Common)?.threshold ?? Number.MAX_SAFE_INTEGER):
      return RarityLevels.get(RarityLevel.Common)
    case rarity > (RarityLevels.get(RarityLevel.Rare)?.threshold ?? Number.MAX_SAFE_INTEGER):
      return RarityLevels.get(RarityLevel.Rare)
    case rarity > (RarityLevels.get(RarityLevel.VeryRare)?.threshold ?? Number.MAX_SAFE_INTEGER):
      return RarityLevels.get(RarityLevel.VeryRare)
    case rarity >= (RarityLevels.get(RarityLevel.ExtremelyRare)?.threshold ?? Number.MAX_SAFE_INTEGER):
      return RarityLevels.get(RarityLevel.ExtremelyRare)
    default:
      return RarityLevels.get(RarityLevel.VeryCommon)
  }
}

export const RarityGraph = ({ trait, rarity }: { trait: Trait; rarity: number }) => {
  const rarityLevel = getRarityLevel(rarity)
  return (
    <Row gap="1.68px" justify="flex-end">
      {Array.from({ length: 20 }).map((_, i) => (
        <RarityBar
          key={trait.trait_value + '_bar_' + i}
          $color={i * 0.05 <= 1 - rarity ? rarityLevel?.color : undefined}
        />
      ))}
    </Row>
  )
}
