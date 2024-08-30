import { Alignment, Fit, Layout, useRive } from '@rive-app/react-canvas'

import { Wallet } from 'pages/Landing/components/Icons'
import { PillButton } from 'pages/Landing/components/cards/PillButton'
import ValuePropCard from 'pages/Landing/components/cards/ValuePropCard'
import { useIsDarkMode } from 'theme/components/ThemeToggle'
import { Flex, useSporeColors } from 'ui/src'
import { t } from 'uniswap/src/i18n'

export function DownloadWalletCard() {
  const theme = useSporeColors()
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
      minHeight={500}
      color="$accent1"
      backgroundColor="rgba(252, 114, 255, 0.12)"
      button={
        <PillButton
          color={theme.accent1.val}
          label={t('common.uniswapWallet')}
          icon={<Wallet size="24px" fill={theme.accent1.val} />}
        />
      }
      titleText={t('common.walletForSwapping')}
    >
      <Flex width="100%" height="75%" position="absolute" m="auto" bottom={0} zIndex={1}>
        {isDarkMode ? (
          <DarkAnimation onMouseEnter={() => darkAnimation?.play()} />
        ) : (
          <LightAnimation onMouseEnter={() => lightAnimation?.play()} />
        )}
      </Flex>
    </ValuePropCard>
  )
}
