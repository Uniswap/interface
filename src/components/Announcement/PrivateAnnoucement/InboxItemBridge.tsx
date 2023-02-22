import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { ReactComponent as ArrowDown } from 'assets/svg/arrow_down.svg'
import { ReactComponent as BridgeIcon } from 'assets/svg/bridge_icon.svg'
import { PrivateAnnouncementProp } from 'components/Announcement/PrivateAnnoucement'
import {
  Dot,
  InboxItemRow,
  InboxItemWrapper,
  PrimaryText,
  RowItem,
  Title,
} from 'components/Announcement/PrivateAnnoucement/styled'
import { AnnouncementTemplateBridge } from 'components/Announcement/type'
import { CheckCircle } from 'components/Icons'
import IconFailure from 'components/Icons/Failed'
import { NetworkLogo } from 'components/Logo'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { MultichainTransfer, MultichainTransferStatus } from 'hooks/bridge/useGetBridgeTransfers'
import useTheme from 'hooks/useTheme'
import { formatAmountBridge } from 'pages/Bridge/helpers'

const NetWorkRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`

function InboxItemBridge({ announcement, onRead, style, time }: PrivateAnnouncementProp) {
  const { templateBody, isRead } = announcement
  const { transaction = {} } = templateBody as AnnouncementTemplateBridge
  const { status, srcTokenSymbol, srcAmount, dstChainId, srcChainId } = transaction as MultichainTransfer
  const isSuccess = Number(status) === MultichainTransferStatus.Success
  const chainIdIn = Number(srcChainId) as ChainId
  const chainIdOut = Number(dstChainId) as ChainId

  const theme = useTheme()

  const navigate = useNavigate()
  const onClick = () => {
    navigate(APP_PATHS.BRIDGE)
    onRead()
  }
  return (
    <InboxItemWrapper isRead={isRead} onClick={onClick} style={style}>
      <InboxItemRow>
        <RowItem>
          <BridgeIcon />
          <Title isRead={isRead}>
            <Trans>Bridge Token</Trans>
          </Title>
          {!isRead && <Dot />}
        </RowItem>
        <RowItem>
          <PrimaryText>{isSuccess ? t`Success` : t`Failed`}</PrimaryText>
          {isSuccess ? <CheckCircle color={theme.primary} /> : <IconFailure color={theme.red} size={12} />}
        </RowItem>
      </InboxItemRow>

      <InboxItemRow>
        <div style={{ position: 'relative' }}>
          <NetWorkRow>
            <NetworkLogo chainId={chainIdIn} style={{ width: 12, height: 12 }} />
            <PrimaryText color={theme.subText}>{NETWORKS_INFO[chainIdIn].name}</PrimaryText>
          </NetWorkRow>
          <ArrowDown style={{ position: 'absolute', left: 4, height: 10 }} />
        </div>

        <PrimaryText>
          {formatAmountBridge(srcAmount)} {srcTokenSymbol}
        </PrimaryText>
      </InboxItemRow>

      <InboxItemRow>
        <NetWorkRow>
          <NetworkLogo chainId={chainIdOut} style={{ width: 12, height: 12 }} />
          <PrimaryText color={theme.subText}>{NETWORKS_INFO[chainIdOut].name}</PrimaryText>
        </NetWorkRow>
        {time}
      </InboxItemRow>
    </InboxItemWrapper>
  )
}
export default InboxItemBridge
