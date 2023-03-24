import { t } from '@lingui/macro'
import styled from 'styled-components'

import { RowBetween } from 'components/Row'
import SubscribeNotificationButton from 'components/SubscribeButton'
import { MIXPANEL_TYPE } from 'hooks/useMixpanel'

import BridgeTransferHistory from '../BridgeTransferHistory'
import TabSelector from './TabSelector'

type Props = {
  className?: string
}

const BridgeHistory: React.FC<Props> = ({ className }) => {
  return (
    <div className={className}>
      <RowBetween>
        <TabSelector />
        <SubscribeNotificationButton
          subscribeTooltip={t`Subscribe to receive notifications on your bridge transaction`}
          trackingEvent={MIXPANEL_TYPE.BRIDGE_CLICK_SUBSCRIBE_BTN}
        />
      </RowBetween>
      <BridgeTransferHistory />
    </div>
  )
}

export default styled(BridgeHistory)`
  width: 100%;
  flex: 1;

  display: flex;
  flex-direction: column;
  gap: 22px;
`
