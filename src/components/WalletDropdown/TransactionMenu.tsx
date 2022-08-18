import { Trans } from '@lingui/macro'

import { SlideOutMenu } from './SlideOutMenu'

export const TransactionHistoryMenu = ({ onClose }: { onClose: () => void }) => (
  <SlideOutMenu onClose={onClose} onClear={undefined} title={<Trans>Transactions</Trans>}>
    <div />
  </SlideOutMenu>
)
