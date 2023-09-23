import { Swap } from '../Icons'
import { PillButton } from './PillButton'
import ValuePropCard from './ValuePropCard'

type DownloadWalletCardProps = {
  isDarkMode?: boolean
  tagText?: string
}

const primary = '#FC72FF'

export function DownloadWalletCard(props: DownloadWalletCardProps) {
  return (
    <ValuePropCard
      height="696px"
      isDarkMode={props.isDarkMode}
      textColor={primary}
      backgroundColor={{ dark: 'rgba(252, 114, 255, 0.12)', light: 'rgba(252, 114, 255, 0.12)' }}
      button={<PillButton color={primary} label="Download the wallet" icon={<Swap size="24px" fill={primary} />} />}
      titleText={`The power of Uniswap in your\npocket`}
    />
  )
}
