import { Alignment, Fit, Layout, useRive } from '@rive-app/react-canvas'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { PillButton } from 'pages/Landing/components/cards/PillButton'
import ValuePropCard from 'pages/Landing/components/cards/ValuePropCard'
import { Wallet } from 'pages/Landing/components/Icons'
import { Trans, useTranslation } from 'react-i18next'
import { useIsDarkMode } from 'theme/components/ThemeToggle'
import { Flex, useSporeColors } from 'ui/src'
import { Star } from 'ui/src/components/icons/Star'
import { uniswapUrls } from 'uniswap/src/constants/urls'

export function DownloadWalletCard() {
  const theme = useSporeColors()
  const isDarkMode = useIsDarkMode()
  const { t } = useTranslation()
  const isUnificationCopyEnabled = useFeatureFlag(FeatureFlags.UnificationCopy)

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
      href={uniswapUrls.downloadWalletUrl}
      minHeight={500}
      color="$accent1"
      backgroundColor="rgba(252, 114, 255, 0.12)"
      title={
        <PillButton
          color={theme.accent1.val}
          label={t('common.uniswapWallet')}
          icon={<Wallet size="24px" fill={theme.accent1.val} />}
        />
      }
      subtitle={t('landing.walletSubtitle')}
      bodyText={
        isUnificationCopyEnabled ? (
          <Trans
            i18nKey="landing.walletBody"
            components={{
              Star: <Star color="$accent1" size="$icon.24" mb={-4} />,
            }}
          />
        ) : (
          <Trans
            i18nKey="landing.walletBody.old"
            components={{
              Star: <Star color="$accent1" size="$icon.24" mb={-4} />,
            }}
          />
        )
      }
      button={
        <PillButton color={theme.accent1.val} label={t('common.downloadUniswapWallet')} backgroundColor="$surface1" />
      }
      $lg={{
        minHeight: 750,
        maxWidth: '100%',
      }}
      $sm={{
        minHeight: 700,
      }}
      $xs={{
        minHeight: 540,
      }}
    >
      <Flex width="100%" height="60%" position="absolute" m="auto" bottom={0} zIndex={1}>
        {isDarkMode ? (
          <DarkAnimation onMouseEnter={() => darkAnimation?.play()} />
        ) : (
          <LightAnimation onMouseEnter={() => lightAnimation?.play()} />
        )}
      </Flex>
    </ValuePropCard>
  )
}
