import { Alignment, Fit, Layout, useRive } from '@rive-app/react-canvas'
import { CodeBrackets } from 'pages/Landing/components/Icons'
import { CardContents } from 'pages/Landing/components/cards/CardContents'
import { PillButton } from 'pages/Landing/components/cards/PillButton'
import ValuePropCard from 'pages/Landing/components/cards/ValuePropCard'
import { useTranslation } from 'react-i18next'
import { validColor } from 'ui/src/theme'

const primary = '#00C3A0'

export function DocumentationCard() {
  const { t } = useTranslation()
  const { rive, RiveComponent } = useRive({
    src: '/rive/landing-page.riv',
    artboard: 'Dev',
    stateMachines: 'Animation',
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.CenterRight }),
  })

  return (
    <ValuePropCard
      smaller
      backgroundColor={validColor(`rgba(0, 195, 160, 0.06)`)}
      $theme-dark={{
        backgroundColor: 'rgba(0, 195, 160, 0.08)',
      }}
      href="https://docs.uniswap.org/"
      color={primary}
      button={
        <PillButton color={primary} label={t('landing.devDocs')} icon={<CodeBrackets size="24px" fill={primary} />} />
      }
      titleText={t('landing.buildNextGen')}
      alignTextToBottom
    >
      <CardContents $xxl={{ opacity: 0.32 }}>
        <RiveComponent onMouseEnter={() => rive && rive.play()} />
      </CardContents>
    </ValuePropCard>
  )
}
