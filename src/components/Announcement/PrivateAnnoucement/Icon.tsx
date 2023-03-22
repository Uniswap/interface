import { ChainId } from '@kyberswap/ks-sdk-core'
import styled from 'styled-components'

import { ReactComponent as BridgeIcon } from 'assets/svg/bridge_icon.svg'
import { ReactComponent as LimitOrderIcon } from 'assets/svg/limit_order.svg'
import { ReactComponent as LiquidityIcon } from 'assets/svg/liquidity_icon.svg'
import { PrivateAnnouncementType } from 'components/Announcement/type'
import DiscoverIcon from 'components/Icons/DiscoverIcon'
import { NetworkLogo } from 'components/Logo'

const IconWrapper = styled.div<{ hasNetwork: boolean }>`
  position: relative;
  ${({ hasNetwork }) => hasNetwork && `margin-right: 4px;`}
`

const mapIcon = {
  [PrivateAnnouncementType.BRIDGE]: <BridgeIcon />,
  [PrivateAnnouncementType.LIMIT_ORDER]: <LimitOrderIcon />,
  [PrivateAnnouncementType.POOL_POSITION]: <LiquidityIcon />,
  [PrivateAnnouncementType.TRENDING_SOON_TOKEN]: <DiscoverIcon size={16} />,
}

export default function InboxIcon({ type, chainId }: { type: PrivateAnnouncementType; chainId?: ChainId }) {
  const icon = mapIcon[type]
  return (
    <IconWrapper hasNetwork={!!chainId}>
      {icon}
      {chainId && (
        <NetworkLogo
          chainId={chainId}
          style={{
            width: 12,
            height: 12,
            position: 'absolute',
            top: -10,
            right: -10,
          }}
        />
      )}
    </IconWrapper>
  )
}
