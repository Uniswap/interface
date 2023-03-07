import { Trans, t } from '@lingui/macro'
import { useNavigate } from 'react-router-dom'
import { Flex } from 'rebass'

import { ReactComponent as LiquidityIcon } from 'assets/svg/liquidity_icon.svg'
import { PrivateAnnouncementProp } from 'components/Announcement/PrivateAnnoucement'
import {
  Dot,
  InboxItemRow,
  InboxItemWrapper,
  PrimaryText,
  RowItem,
  Title,
} from 'components/Announcement/PrivateAnnoucement/styled'
import { AnnouncementTemplatePoolPosition } from 'components/Announcement/type'
import { DoubleCurrencyLogoV2 } from 'components/DoubleLogo'
import { MoneyBag } from 'components/Icons'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'

function InboxItemBridge({
  announcement,
  onRead,
  style,
  time,
}: PrivateAnnouncementProp<AnnouncementTemplatePoolPosition>) {
  const { networkInfo } = useActiveWeb3React()
  const { templateBody, isRead } = announcement
  const theme = useTheme()

  const {
    currentPrice,
    maxPrice,
    minPrice,
    token0LogoURL,
    token0Symbol,
    token1LogoURL,
    token1Symbol,
    poolAddress,
    type,
  } = templateBody.position
  const isInRange = type === 'IN_RANGE'
  const statusMessage = isInRange ? t`Back in range` : t`Out of range`

  const navigate = useNavigate()
  const onClick = () => {
    navigate(`${APP_PATHS.MY_POOLS}/${networkInfo.route}?search=${poolAddress}`)
    onRead(announcement, statusMessage)
  }

  return (
    <InboxItemWrapper isRead={isRead} onClick={onClick} style={style}>
      <InboxItemRow>
        <RowItem>
          <LiquidityIcon />
          <Title isRead={isRead}>
            <Trans>Liquidity Pool Alert</Trans>
          </Title>
          {!isRead && <Dot />}
        </RowItem>
        <RowItem>
          <PrimaryText>{statusMessage}</PrimaryText>
          <MoneyBag color={isInRange ? theme.apr : theme.warning} size={16} />
        </RowItem>
      </InboxItemRow>

      <InboxItemRow>
        <Flex alignItems={'center'}>
          <DoubleCurrencyLogoV2
            style={{ marginRight: 12 }}
            logoUrl1={token0LogoURL}
            logoUrl2={token1LogoURL}
            size={12}
          />
          <PrimaryText>
            {token0Symbol}/{token1Symbol}
          </PrimaryText>
        </Flex>
        <PrimaryText color={isInRange ? theme.primary : theme.warning}>
          {currentPrice} {token0Symbol}/{token1Symbol}
        </PrimaryText>
      </InboxItemRow>

      <InboxItemRow>
        <PrimaryText color={theme.subText}>
          {minPrice} - {maxPrice} {token0Symbol}/{token1Symbol}
        </PrimaryText>
        {time}
      </InboxItemRow>
    </InboxItemWrapper>
  )
}
export default InboxItemBridge
