import { Alignment, Fit, Layout, useRive } from '@rive-app/react-canvas'
import { t } from 'i18n'
import styled, { useTheme } from 'lib/styled-components'
import { Wallet } from 'pages/Landing/components/Icons'
import { PillButton } from 'pages/Landing/components/cards/PillButton'
import ValuePropCard from 'pages/Landing/components/cards/ValuePropCard'
import { useIsDarkMode } from 'theme/components/ThemeToggle'

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
          label={t('common.uniswapWallet')}
          icon={<Wallet size="24px" fill={theme.accent1} />}
        />
      }
      titleText={t('common.walletForSwapping')}
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
