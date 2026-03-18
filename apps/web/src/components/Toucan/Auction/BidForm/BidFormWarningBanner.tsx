import { useTranslation } from 'react-i18next'
import { InlineAlertBanner } from '~/components/Toucan/Shared/InlineAlertBanner'

interface BidFormWarningBannerProps {
  isVisible: boolean
}

export function BidFormWarningBanner({ isVisible }: BidFormWarningBannerProps): JSX.Element | null {
  const { t } = useTranslation()

  if (!isVisible) {
    return null
  }

  return (
    <InlineAlertBanner
      title={t('toucan.auction.bidForm.unsupported.title')}
      description={t('toucan.auction.bidForm.unsupported.description')}
      variant="warning"
    />
  )
}
