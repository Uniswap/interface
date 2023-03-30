import { ChainId } from '@kyberswap/ks-sdk-core'
import { useNavigate } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import InboxIcon from 'components/Announcement/PrivateAnnoucement/Icon'
import { PrivateAnnouncementPropCenter } from 'components/Announcement/PrivateAnnoucement/NotificationCenter'
import { AnnouncementTemplateLimitOrder } from 'components/Announcement/type'
import Logo from 'components/Logo'
import { LimitOrderStatus } from 'components/swapv2/LimitOrder/type'
import { APP_PATHS } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { formatTime } from 'utils/time'

import { Desc, Time, Title, Wrapper } from './styled'

const StyledLogo = styled(Logo)`
  width: 16px;
  height: 16px;
  border-radius: 50%;
`
export default function AnnouncementItem({
  announcement,
  title,
}: PrivateAnnouncementPropCenter<AnnouncementTemplateLimitOrder>) {
  const { sentAt, templateType, templateBody } = announcement
  const {
    status,
    makerAssetSymbol,
    takerAssetSymbol,
    makerAssetLogoURL,
    makingAmount,
    takingAmount,
    takingAmountRate,
    filledPercent,
    chainId: rawChainId,
    takerAssetLogoURL,
  } = templateBody.order
  const isFilled = status === LimitOrderStatus.FILLED
  const isPartialFilled = status === LimitOrderStatus.PARTIALLY_FILLED
  const chainId = rawChainId && rawChainId !== '{{.chainId}}' ? (Number(rawChainId) as ChainId) : undefined
  const theme = useTheme()

  const statusMessage = isFilled ? (
    <Text as="span" color={theme.primary}>
      successfully filled
    </Text>
  ) : isPartialFilled ? (
    <Text as="span" color={theme.warning}>
      partially filled ({filledPercent})
    </Text>
  ) : (
    <Text as="span" color={theme.warning}>
      expired ({filledPercent}% filled)
    </Text>
  )

  const navigate = useNavigate()
  return (
    <Wrapper onClick={() => navigate(APP_PATHS.LIMIT)}>
      <Flex justifyContent="space-between" width="100%">
        <Title>
          <InboxIcon type={templateType} chainId={chainId} />
          {title}
        </Title>
        <Flex alignItems={'center'}>
          <Time>{formatTime(sentAt)} </Time>
        </Flex>
      </Flex>
      <Desc>
        Your order to pay <StyledLogo srcs={[makerAssetLogoURL]} /> {makingAmount} {makerAssetSymbol} and receive{' '}
        <StyledLogo srcs={[takerAssetLogoURL]} /> {takingAmount} {takerAssetSymbol} when{' '}
        <span>1 {makerAssetSymbol} is equal to </span>
        <span>
          {takingAmountRate} {takerAssetSymbol}
        </span>{' '}
        was {statusMessage}
      </Desc>
    </Wrapper>
  )
}
