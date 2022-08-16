import { Trans } from '@lingui/macro'

import { SlideOutMenu } from './SlideOutMenu'

export const TransactionHistoryMenu = ({ close }: { close: () => void }) => {
  return (
    <SlideOutMenu close={close} clear={undefined} title={<Trans>Transactions</Trans>}>
      <div />
    </SlideOutMenu>
  )
}
