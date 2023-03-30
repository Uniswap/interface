import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { Repeat } from 'react-feather'
import { useNavigate } from 'react-router-dom'

import { PrivateAnnouncementProp } from 'components/Announcement/PrivateAnnoucement'
import InboxIcon from 'components/Announcement/PrivateAnnoucement/Icon'
import {
  Dot,
  InboxItemRow,
  InboxItemWrapper,
  PrimaryText,
  RowItem,
  Title,
} from 'components/Announcement/PrivateAnnoucement/styled'
import { AnnouncementTemplateLimitOrder } from 'components/Announcement/type'
import { CheckCircle } from 'components/Icons'
import DeltaTokenAmount from 'components/WalletPopup/Transactions/DeltaTokenAmount'
import { LimitOrderStatus } from 'components/swapv2/LimitOrder/type'
import { APP_PATHS } from 'constants/index'
import useTheme from 'hooks/useTheme'

function InboxItemBridge({
  announcement,
  onRead,
  style,
  time,
  title,
}: PrivateAnnouncementProp<AnnouncementTemplateLimitOrder>) {
  const { templateBody, isRead, templateType } = announcement
  const theme = useTheme()
  const {
    status,
    makerAssetSymbol,
    takerAssetSymbol,
    makerAssetLogoURL,
    takerAssetLogoURL,
    filledMakingAmount,
    makingAmount,
    takingAmount,
    filledTakingAmount,
    filledPercent,
    increasedFilledPercent,
    takingAmountRate,
    chainId: rawChainId,
  } = templateBody.order
  const isFilled = status === LimitOrderStatus.FILLED
  const isPartialFilled = status === LimitOrderStatus.PARTIALLY_FILLED
  const chainId = rawChainId && rawChainId !== '{{.chainId}}' ? (Number(rawChainId) as ChainId) : undefined
  const statusMessage = isFilled
    ? t`100% Filled`
    : isPartialFilled
    ? t`${filledPercent} Filled ${increasedFilledPercent}`
    : `${filledPercent}% Filled | Expired`

  const navigate = useNavigate()
  const onClick = () => {
    navigate(APP_PATHS.LIMIT)
    onRead(announcement, statusMessage)
  }

  return (
    <InboxItemWrapper isRead={isRead} onClick={onClick} style={style}>
      <InboxItemRow>
        <RowItem>
          <InboxIcon type={templateType} chainId={chainId} />
          <Title isRead={isRead}>{title}</Title>
          {!isRead && <Dot />}
        </RowItem>
        <RowItem>
          <PrimaryText>{statusMessage}</PrimaryText>
          {isFilled ? (
            <CheckCircle color={theme.primary} />
          ) : isPartialFilled ? (
            <Repeat color={theme.warning} size={12} />
          ) : (
            <CheckCircle color={theme.warning} />
          )}
        </RowItem>
      </InboxItemRow>

      <InboxItemRow>
        <DeltaTokenAmount
          plus
          amount={`${isFilled ? takingAmount : filledTakingAmount}/${takingAmount}`}
          symbol={takerAssetSymbol}
          logoURL={takerAssetLogoURL}
        />
        <PrimaryText>
          {takingAmountRate} {makerAssetSymbol}/{takerAssetSymbol}
        </PrimaryText>
      </InboxItemRow>

      <InboxItemRow>
        <DeltaTokenAmount
          plus={false}
          amount={`${isFilled ? makingAmount : filledMakingAmount}/${makingAmount}`}
          symbol={makerAssetSymbol}
          logoURL={makerAssetLogoURL}
        />
        {time}
      </InboxItemRow>
    </InboxItemWrapper>
  )
}
export default InboxItemBridge
