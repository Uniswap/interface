import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useNavigate } from 'react-router-dom'
import { Flex } from 'rebass'

import InboxIcon from 'components/Announcement/PrivateAnnoucement/Icon'
import { PrivateAnnouncementPropCenter } from 'components/Announcement/PrivateAnnoucement/NotificationCenter'
import { AnnouncementTemplateBridge } from 'components/Announcement/type'
import { NetworkLogo } from 'components/Logo'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { MultichainTransferStatus } from 'hooks/bridge/useGetBridgeTransfers'
import { formatAmountBridge } from 'pages/Bridge/helpers'
import { formatTime } from 'utils/time'

import { Desc, Time, Title, Wrapper } from './styled'

export default function AnnouncementItem({
  announcement,
  title,
}: PrivateAnnouncementPropCenter<AnnouncementTemplateBridge>) {
  const { sentAt, templateType, templateBody } = announcement
  const { status, srcTokenSymbol, srcAmount, dstChainId, srcChainId } = templateBody.transaction
  const isSuccess = Number(status) === MultichainTransferStatus.Success
  const chainIdIn = Number(srcChainId) as ChainId
  const chainIdOut = Number(dstChainId) as ChainId
  const navigate = useNavigate()
  return (
    <Wrapper onClick={() => navigate(APP_PATHS.BRIDGE)}>
      <Flex justifyContent="space-between" width="100%">
        <Title>
          <InboxIcon type={templateType} />
          {title}
        </Title>
        <Flex alignItems={'center'}>
          <Time>{formatTime(sentAt)} </Time>
        </Flex>
      </Flex>
      <Desc>
        {formatAmountBridge(srcAmount)} {srcTokenSymbol}{' '}
        {isSuccess ? t`has been successfully transferred from` : t`has been failed to transferred from`}{' '}
        <NetworkLogo chainId={chainIdIn} style={{ width: 16, height: 16 }} /> {NETWORKS_INFO[chainIdIn].name} to{' '}
        <NetworkLogo chainId={chainIdOut} style={{ width: 16, height: 16 }} /> {NETWORKS_INFO[chainIdOut].name}
      </Desc>
    </Wrapper>
  )
}
