import styled from 'styled-components'

import BridgeTransferHistory from '../BridgeTransferHistory'
import TabSelector from './TabSelector'

type Props = {
  className?: string
}

const BridgeHistory: React.FC<Props> = ({ className }) => {
  return (
    <div className={className}>
      <TabSelector />
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
