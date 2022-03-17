import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { X } from 'react-feather'
import { Text } from 'rebass'
import Announcement from 'components/Icons/Announcement'
import { ExternalLink } from 'theme'
import { useMedia, useLocalStorage } from 'react-use'

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

const banner = {
  localStorageKey: 'benqi-lm',
  start: 'Thu, 17 Mar 2022 00:00:00 GMT',
  end: 'Thu, 20 Mar 2022 00:00:00 GMT',
  text: (
    <Text marginLeft="4px" marginRight="1rem" lineHeight="20px" color="#fff">
      Liquidity Mining with Benqi is <b>LIVE!</b> Find out more{' '}
      <ExternalLink href="https://kyberswap.com/?utm_source=kyberswap&utm_medium=banner&utm_campaign=benqi&utm_content=launch#/farms?networkId=43114">
        here
      </ExternalLink>
    </Text>
  ),
}

function TopBanner() {
  const below768 = useMedia('(max-width: 768px)')

  const [showBanner, setShowBanner] = useLocalStorage(banner.localStorageKey, true)

  const [show, setShow] = useState(false)

  useEffect(() => {
    setTimeout(() => setShow(!!showBanner), 200)
  }, [showBanner])

  if (!show) return null
  const now = new Date()
  if (now > new Date(banner.start) && now < new Date(banner.end))
    return (
      <BannerWrapper>
        {!below768 && <div />}
        <Content>
          {!below768 && <Announcement />}
          {banner.text}
        </Content>

        <StyledClose size={28} onClick={() => setShowBanner(false)} />
      </BannerWrapper>
    )

  return null
}

export default TopBanner
