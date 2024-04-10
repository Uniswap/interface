import { t } from '@lingui/macro'
import { Alignment, Fit, Layout, useRive } from '@rive-app/react-canvas'
import styled, { useTheme } from 'styled-components'
import { useIsDarkMode } from 'theme/components/ThemeToggle'

import { Wallet } from '../Icons'
import { PillButton } from './PillButton'
import ValuePropCard from './ValuePropCard'

const Contents = styled.div`
  width: 100%;
  height: 75%;
  position: absolute;
  margin: auto;
  bottom: 0;
  z-index: 1;
  @media (max-width: 980px) and (min-width: 768px) {
    width: 125%;
    transform: translateX(-10.25%);
  }
`

export function DownloadWalletCard() {
  const theme = useTheme()
  const isDarkMode = useIsDarkMode()

  const { rive: lightAnimation, RiveComponent: LightAnimation } = useRive({
    src: '/rive/landing-page.riv',
    artboard: 'Mobile-Light',
    stateMachines: 'Animation',
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.BottomCenter }),
  })

  const { rive: darkAnimation, RiveComponent: DarkAnimation } = useRive({
    src: '/rive/landing-page.riv',
    artboard: 'Mobile-Dark',
    stateMachines: 'Animation',
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.BottomCenter }),
  })

  return (
    <ValuePropCard
      href="https://wallet.uniswap.org/"
      minHeight="500px"
      isDarkMode={isDarkMode}
      textColor={theme.accent1}
      backgroundColor={{ dark: 'rgba(252, 114, 255, 0.12)', light: 'rgba(252, 114, 255, 0.12)' }}
      button={
        <PillButton
          color={theme.accent1}
          label={t`Uniswap wallet`}
          icon={<Wallet size="24px" fill={theme.accent1} />}
        />
      }
      titleText={t`The wallet built for swapping. Available on iOS and Android.`}
    >
      <Contents>
        {isDarkMode ? (
          <DarkAnimation onMouseEnter={() => darkAnimation?.play()} />
        ) : (
          <LightAnimation onMouseEnter={() => lightAnimation?.play()} />
        )}
      </Contents>
    </ValuePropCard>
  )
}
