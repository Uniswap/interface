import { useTranslation } from 'react-i18next'
import type { MarginHealthKey } from '~/pages/Swap/Margin/marginFormat'

// Localized label per health tier — the single source shared by every render site. The literal t() calls
// keep the keys extractable: i18next-parser (keepRemoved: false) prunes any key it can't see statically,
// so a dynamic t(keyVariable) elsewhere would silently drop them.
export function useMarginHealthLabels(): Record<MarginHealthKey, string> {
  const { t } = useTranslation()
  return {
    healthy: t('margin.health.healthy'),
    caution: t('margin.health.caution'),
    atRisk: t('margin.health.atRisk'),
  }
}
