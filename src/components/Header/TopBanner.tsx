// import { rgba } from 'polished'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { useEffect, useState } from 'react'
import { X } from 'react-feather'
import { useLocalStorage, useMedia } from 'react-use'
import { Text } from 'rebass'
import styled from 'styled-components'

import Announcement from 'components/Icons/Announcement'
import { useActiveWeb3React } from 'hooks'
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

const banner = {
  localStorageKey: 'bsc-maintenance-',
  start: 'Thu, 7 Oct 2022 00:00:00 GMT',
  end: 'Thu, 30 Oct 2022 00:00:00 GMT',
  onlyChains: [ChainId.BSCMAINNET],
  text: (
    <Text marginLeft="4px" marginRight="1rem" lineHeight="20px" color="#fff" fontSize="14px" flex={1}>
      BNB Chain is currently under maintenance and has been paused temporarily. For further info please refer to{' '}
      <ExternalLink
        href="https://twitter.com/BNBCHAIN/status/1578148078636650496"
        style={{ color: '#fff', fontWeight: 500, textDecoration: 'underline' }}
      >
        this
      </ExternalLink>{' '}
      official announcement from the Binance Team.
    </Text>
  ),
}

function TopBanner() {
  const below768 = useMedia('(max-width: 768px)')

  const [showBanner, setShowBanner] = useLocalStorage(banner.localStorageKey, true)
  const { chainId } = useActiveWeb3React()

  const [show, setShow] = useState(false)

  useEffect(() => {
    setTimeout(() => setShow(!!showBanner), 200)
  }, [showBanner])

  if (!show || (chainId && !banner.onlyChains.includes(chainId))) return null
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
