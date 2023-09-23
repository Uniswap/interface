import { Swap } from '../Icons'
import { PillButton } from './PillButton'
import ValuePropCard from './ValuePropCard'

type WebappCardProps = {
  isDarkMode?: boolean
  tagText?: string
}

const primary = '#627EEA'

export function WebappCard(props: WebappCardProps) {
  return (
    <ValuePropCard
      height="696px"
      isDarkMode={props.isDarkMode}
      textColor={primary}
      backgroundColor={{ dark: 'rgba(98, 126, 234, 0.20)', light: 'rgba(98, 126, 234, 0.10)' }}
      button={<PillButton color={primary} label="Web app" icon={<Swap size="24px" fill={primary} />} />}
      titleText={`Swapping made simple.\nAccess thousands of tokens on 7+ chains.`}
    />
  )
}
