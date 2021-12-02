import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { X } from 'react-feather'
import { Text } from 'rebass'
import Announcement from 'components/Icons/Announcement'
import { ExternalLink } from 'theme'
import { useMedia } from 'react-use'
import { useRebrandingAnnouncement, useToggleRebrandingAnnouncement } from 'state/user/hooks'
import { Trans } from '@lingui/macro'

const BannerWrapper = styled.div`
  width: 100%;
  padding: 10px 20px;
  background: #1d7a5f;
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const StyledClose = styled(X)`
  color: white;
  :hover {
    cursor: pointer;
  }
`

const Content = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  padding: 8px 16px;
  background: ${({ theme }) => `${theme.buttonBlack}1a`};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    background: transparent;
    padding: 2px 0;
    font-size: 14px;
  `}
`

function KyberSwapAnounce() {
  const below768 = useMedia('(max-width: 768px)')

  const rebrandingAnnouncement = useRebrandingAnnouncement()
  const toggleRebrandingAnnouncement = useToggleRebrandingAnnouncement()

  const [show, setShow] = useState(false)

  useEffect(() => {
    setTimeout(() => setShow(rebrandingAnnouncement), 200)
  }, [rebrandingAnnouncement])

  if (!show) return null

  return (
    <BannerWrapper>
      {!below768 && <div />}
      <Content>
        {!below768 && <Announcement />}
        <Trans>
          <Text marginLeft="4px" marginRight="1rem" lineHeight="20px" color="#fff">
            dmm.exchange is now <b>KyberSwap.com</b>! Click{' '}
            <ExternalLink href=" https://blog.kyber.network/dmm-is-now-kyberswap-com-on-a-mission-to-provide-the-best-trading-and-earning-experience-in-defi-7664fa29f458">
              here
            </ExternalLink>{' '}
            to learn more.
          </Text>
        </Trans>
      </Content>

      <StyledClose size={28} onClick={() => toggleRebrandingAnnouncement()} />
    </BannerWrapper>
  )
}

export default KyberSwapAnounce
