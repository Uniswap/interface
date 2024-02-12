import { t } from '@lingui/macro'
import Rive, { Alignment, Fit, Layout } from '@rive-app/react-canvas'
import styled from 'styled-components'
import { useIsDarkMode } from 'theme/components/ThemeToggle'

import { Wallet } from '../Icons'
import { PillButton } from './PillButton'
import ValuePropCard from './ValuePropCard'

const Contents = styled.div`
  display: flex;
  flex-direction: column-reverse;
  align-items: center;

  position: absolute;
  width: 100%;
  bottom: 0;
  padding: 16px;
  padding-bottom: 0;
`

type DownloadWalletCardProps = {
  isDarkMode?: boolean
  tagText?: string
}

const primary = '#FC72FF'

export function DownloadWalletCard(props: DownloadWalletCardProps) {
  const isDarkMode = useIsDarkMode()
  return (
    <ValuePropCard
      href="https://wallet.uniswap.org/"
      height="696px"
      minHeight="500px"
      isDarkMode={props.isDarkMode}
      textColor={primary}
      backgroundColor={{ dark: 'rgba(252, 114, 255, 0.12)', light: 'rgba(252, 114, 255, 0.12)' }}
      button={<PillButton color={primary} label="Download the wallet" icon={<Wallet size="24px" fill={primary} />} />}
      titleText={t`The power of Uniswap in your pocket.`}
    >
      <Contents>
        <Rive
          style={{ width: '100%', height: '600px' }}
          src="/rive/landingPageAnimations.riv"
          artboard={isDarkMode ? 'Mobile-Dark' : 'Mobile-Light'}
          stateMachines="HoverAnimation"
          layout={
            new Layout({
              fit: Fit.Contain,
              alignment: Alignment.BottomCenter,
            })
          }
        />
      </Contents>
    </ValuePropCard>
  )
}
