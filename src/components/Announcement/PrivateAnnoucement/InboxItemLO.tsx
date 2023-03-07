import { Trans, t } from '@lingui/macro'
import { Repeat } from 'react-feather'
import { useNavigate } from 'react-router-dom'

import { ReactComponent as LimitOrderIcon } from 'assets/svg/limit_order.svg'
import { PrivateAnnouncementProp } from 'components/Announcement/PrivateAnnoucement'
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
}: PrivateAnnouncementProp<AnnouncementTemplateLimitOrder>) {
  const { templateBody, isRead } = announcement
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
  } = templateBody.order
  const isFilled = status === LimitOrderStatus.FILLED
  const isPartialFilled = status === LimitOrderStatus.PARTIALLY_FILLED

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
          <LimitOrderIcon />
          <Title isRead={isRead}>
            <Trans>Limit Order</Trans>
          </Title>
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
