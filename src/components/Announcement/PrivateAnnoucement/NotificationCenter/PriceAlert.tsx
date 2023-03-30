import { Trans } from '@lingui/macro'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import InboxIcon from 'components/Announcement/PrivateAnnoucement/Icon'
import { getSwapUrlPriceAlert } from 'components/Announcement/PrivateAnnoucement/InboxItemPriceAlert'
import { PrivateAnnouncementPropCenter } from 'components/Announcement/PrivateAnnoucement/NotificationCenter'
import { useNavigateToUrl } from 'components/Announcement/helper'
import { AnnouncementTemplatePriceAlert } from 'components/Announcement/type'
import AlertCondition from 'pages/NotificationCenter/PriceAlerts/AlertCondition'
import { formatTime } from 'utils/time'

import { Desc, Time, Title, Wrapper } from './styled'

const SupplementaryTextWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 12px 16px;
  justify-content: space-between;
  flex-wrap: wrap;

  font-size: 12px;
  white-space: nowrap;
  line-height: 16px;
  color: ${({ theme }) => theme.subText};

  ${({ theme }) => theme.mediaWidth.upToMedium`
    flex-direction: column;
    ${EmptySupplementaryText} {
      display: none;
    }
  `}
`

const EmptySupplementaryText = styled.span``

const PriceAlertAnnouncement: React.FC<PrivateAnnouncementPropCenter<AnnouncementTemplatePriceAlert>> = ({
  announcement,
  title,
}) => {
  const { templateBody, sentAt, templateType } = announcement
  const { chainId, note } = templateBody.alert
  const navigate = useNavigateToUrl()
  const onClick = () => {
    navigate(getSwapUrlPriceAlert(templateBody.alert), Number(chainId))
  }
  return (
    <Wrapper onClick={onClick}>
      <Flex justifyContent="space-between" width="100%">
        <Title>
          <InboxIcon type={templateType} chainId={Number(chainId)} />
          {title}
        </Title>
        <Flex alignItems={'center'}>
          <Time>{formatTime(sentAt)} </Time>
        </Flex>
      </Flex>
      <Desc>
        <AlertCondition alertData={templateBody.alert} shouldIncludePrefix={true} />
        {note ? (
          <SupplementaryTextWrapper>
            <Text as="span" sx={{ whiteSpace: 'break-spaces', overflowWrap: 'anywhere' }}>
              <Trans>Note</Trans>: {note}
            </Text>
          </SupplementaryTextWrapper>
        ) : null}
      </Desc>
    </Wrapper>
  )
}

export default PriceAlertAnnouncement
