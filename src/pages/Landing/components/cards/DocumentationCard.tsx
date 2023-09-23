import { Swap } from '../Icons'
import { PillButton } from './PillButton'
import ValuePropCard from './ValuePropCard'

type WebappCardProps = {
  isDarkMode?: boolean
  tagText?: string
}

const primary = '#1DA16A'

export function DocumentationCard(props: WebappCardProps) {
  return (
    <ValuePropCard
      height="320px"
      backgroundColor={{ dark: 'rgba(22, 222, 139, 0.12)', light: 'rgba(22, 222, 139, 0.06)' }}
      isDarkMode={props.isDarkMode}
      textColor={primary}
      button={<PillButton color={primary} label="Documentation" icon={<Swap size="24px" fill={primary} />} />}
      titleText={`Build open apps and\ntools that you want to\nsee in the world.`}
    />
  )
}
