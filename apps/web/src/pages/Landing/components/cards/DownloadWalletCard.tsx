import { Wallet } from 'pages/Landing/components/Icons'
import { PillButton } from 'pages/Landing/components/cards/PillButton'
import ValuePropCard from 'pages/Landing/components/cards/ValuePropCard'
import { Suspense, lazy } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useIsDarkMode } from 'theme/components/ThemeToggle'
import { useSporeColors } from 'ui/src'
import { Star } from 'ui/src/components/icons/Star'
import { uniswapUrls } from 'uniswap/src/constants/urls'

// Lazy load the Rive animation component to avoid SSR issues
const RiveAnimation = lazy(() => import('./RiveAnimation'))

export function DownloadWalletCard() {
  const theme = useSporeColors()
  const isDarkMode = useIsDarkMode()
  const { t } = useTranslation()

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
        <Trans
          i18nKey="landing.walletBody"
          components={{
            Star: <Star color="$accent1" size="$icon.24" mb={-4} />,
          }}
        />
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
      <Suspense fallback={null}>
        <RiveAnimation isDarkMode={isDarkMode} />
      </Suspense>
    </ValuePropCard>
  )
}
