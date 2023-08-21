import { Trans } from '@lingui/macro'

import { SlideOutMenu } from './SlideOutMenu'

export default function CurrencyMenu({ onClose }: { onClose: () => void }) {
  return (
    <SlideOutMenu title={<Trans>Currency</Trans>} onClose={onClose}>
      Currency Option
    </SlideOutMenu>
  )
}
