// import { rgba } from 'polished'
import { useEffect, useState } from 'react'
import { X } from 'react-feather'
import { useLocalStorage, useMedia } from 'react-use'
import { Text } from 'rebass'
import styled from 'styled-components'

import Announcement from 'components/Icons/Announcement'
import { ExternalLink } from 'theme'

const BannerWrapper = styled.div`
  width: 100%;
  padding: 10px 12px 10px 20px;
  background: ${({ theme }) => theme.warning};
  display: flex;
  align-items: center;
  justify-content: space-between;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    align-items: flex-start;
  `}
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
  gap: 8px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 14px;
    align-items: flex-start;
    flex: 1;
  `}
`

// const farmBanner = {
//   localStorageKey: 'farm-issue',
//   start: 'Thu, 17 Mar 2022 00:00:00 GMT',
//   end: 'Thu, 20 Mar 2024 00:00:00 GMT',
//   text: (
//     <Text marginLeft="4px" marginRight="1rem" lineHeight="20px" color="#fff" fontSize="14px" flex={1}>
//       Important Announcement: If you’re currently participating in our Elastic Farms on Polygon & Avalanche, please read
//       this{' '}
//       <ExternalLink
//         href="https://blog.kyber.network/important-community-update-about-kyberswap-elastic-farms-4f69d7ada1e8"
//         style={{ color: '#fff', fontWeight: 500, textDecoration: 'underline' }}
//       >
//         announcement!
//       </ExternalLink>
//     </Text>
//   ),
// }

const banner = {
  localStorageKey: 'xss-issue',
  start: 'Thu, 17 Mar 2022 00:00:00 GMT',
  end: 'Thu, 20 Mar 2022 00:00:00 GMT',
  text: (
    <Text marginLeft="4px" marginRight="1rem" lineHeight="20px" color="#fff" fontSize="14px" flex={1}>
      Urgent Announcement: We identified a front-end issue with KyberSwap that asked a few users to approve a malicious
      contract on Ethereum and Polygon networks. The source of the issue was identified & fixed immediately. A detailed
      analysis of the incident together with the next steps can be found{' '}
      <ExternalLink
        href="https://blog.kyber.network/notice-of-exploit-of-kyberswap-frontend-963aa8febd6a"
        style={{ color: '#fff', fontWeight: 500, textDecoration: 'underline' }}
      >
        here.
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
          <Announcement />
          {banner.text}
        </Content>

        <StyledClose size={24} onClick={() => setShowBanner(false)} />
      </BannerWrapper>
    )

  return null
}

export default TopBanner
