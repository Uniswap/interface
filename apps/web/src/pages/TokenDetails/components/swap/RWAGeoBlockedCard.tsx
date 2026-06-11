import { useTranslation } from 'react-i18next'
import { InlineCard } from 'ui/src'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'
import { GlobeFilled } from 'ui/src/components/icons/GlobeFilled'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { openUri } from 'uniswap/src/utils/linking'

function openRWARegionRestrictionArticle(): void {
  openUri({ uri: uniswapUrls.helpArticleUrls.rwaRegionRestriction })
}

export function RWAGeoBlockedCard({ tokenSymbol }: { tokenSymbol?: string }): JSX.Element {
  const { t } = useTranslation()

  return (
    <InlineCard
      Icon={GlobeFilled}
      color="$neutral2"
      iconColor="$neutral2"
      description={t('token.rwa.geoBlocked.description', { tokenSymbol: tokenSymbol ?? '' })}
      CtaButtonIcon={ExternalLink}
      onPressCtaButton={openRWARegionRestrictionArticle}
    />
  )
}
