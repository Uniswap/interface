import { Swap } from '../Icons'
import { PillButton } from './PillButton'
import ValuePropCard from './ValuePropCard'

type LiquidityCardProps = {
  isDarkMode?: boolean
  tagText?: string
}

const primary = '#A457FF'

export function LiquidityCard(props: LiquidityCardProps) {
  return (
    <ValuePropCard
      tagText="Provide Liquidity"
      height="320px"
      isDarkMode={props.isDarkMode}
      textColor={primary}
      backgroundColor={{ dark: 'rgba(164, 87, 255, 0.15)', light: 'rgba(164, 87, 255, 0.15)' }}
      button={<PillButton color={primary} label="Liquidity" icon={<Swap size="24px" fill={primary} />} />}
      titleText={`Provide liquidity to pools\non the Uniswap protocol\nand earn fees on swaps.`}
    />
  )
}
