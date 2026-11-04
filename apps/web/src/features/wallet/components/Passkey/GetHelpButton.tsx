import { Anchor, Button } from '@universe/mycelium'
import { EnvelopeHeart } from '@universe/mycelium/icons/EnvelopeHeart'
import { useTranslation } from 'react-i18next'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'

export function GetHelpButton({ t }: { t: ReturnType<typeof useTranslation>['t'] }): JSX.Element {
  return (
    <Anchor target="_blank" rel="noreferrer" href={UniswapHelpUrls.articles.passkeysInfo} textDecorationLine="none">
      <Button icon={<EnvelopeHeart size="$icon.16" color="$neutral2" />} size="xxsmall" emphasis="secondary">
        {t('common.getHelp.button')}
      </Button>
    </Anchor>
  )
}
