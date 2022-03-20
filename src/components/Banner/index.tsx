import React from 'react'
import AvaxContestDesktop from 'assets/banners/Avax-Contest-Desktop.png'
import AvaxContestMobile from 'assets/banners/Avax-Contest-mobile.png'
import AvaxContestTablet from 'assets/banners/Avax-Contest-Tablet.png'
import AvaxLMDesktop from 'assets/banners/Avax-LM-desktop.png'
import AvaxLMMobile from 'assets/banners/Avax-LM-mobile.png'
import AvaxLMTablet from 'assets/banners/Avax-LM-tablet.png'
import { useWindowSize } from 'hooks/useWindowSize'
import styled from 'styled-components'
import { X } from 'react-feather'
import { ExternalLink } from 'theme'
import useTheme from 'hooks/useTheme'
import { Flex } from 'rebass'
import { useLocalStorage } from 'react-use'

const Wrapper = styled.div`
  margin: auto;
  position: relative;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;

  img {
    border-radius: 8px;
  }
`

const Close = styled(X)`
  position: absolute;
  top: 0;
  right: 0;
  background: ${({ theme }) => theme.buttonBlack + '66'};
  padding: 4px;
  cursor: pointer;
  border-bottom-left-radius: 8px;
`

function Banner({ margin, padding, maxWidth }: { margin?: string; padding?: string; maxWidth?: string }) {
  const size = useWindowSize()
  const w = size?.width || 0
  const theme = useTheme()

  const [showBanner, setShowBanner] = useLocalStorage('put-up-banner', true)

  const banners = [
    {
      start: new Date(),
      end: new Date(1647867600000), // March 21, 2022 - 20h VNT
      img: w >= 768 ? AvaxContestDesktop : w >= 500 ? AvaxContestTablet : AvaxContestMobile,
      link:
        'https://medium.com/@kyberteam/50-000-in-rewards-for-kyberswaps-sure-win-trading-contest-with-avax-9af822f6ae12',
    },
    {
      start: new Date(1647867600000), // March 21, 2022 - 20h VNT
      end: new Date(1651276800000), // April 30, 2022 - 0h GMT+0
      img: w >= 768 ? AvaxLMDesktop : w >= 500 ? AvaxLMTablet : AvaxLMMobile,
      link:
        'https://medium.com/kybernetwork/avalanche-rush-phase-2-starts-now-on-kyberswap-with-1m-in-liquidity-mining-rewards-bf22536df4dc',
    },
  ]

  const banner = banners.find(b => {
    const date = new Date()
    return date >= b.start && date <= b.end
  })

  if (!banner || !showBanner) return null

  return (
    <Flex margin={margin || 'auto'} padding={padding} maxWidth={maxWidth || '1028px'} width="100%">
      <Wrapper>
        <ExternalLink href={banner.link}>
          <img src={banner.img} alt="banner" width="100%" />
        </ExternalLink>
        <Close color={theme.white} role="button" onClick={() => setShowBanner(false)} />
      </Wrapper>
    </Flex>
  )
}

export default Banner
