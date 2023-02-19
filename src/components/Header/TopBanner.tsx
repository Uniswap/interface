// import { rgba } from 'polished'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { Fragment, useEffect, useState } from 'react'
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

type TextNode =
  | string
  | {
      text: string
      link: string
    }

type Banner = {
  key: string
  start: string
  end: string
  onlyChains: ChainId[]
  text: TextNode[]
}

const banners: Banner[] = [
  {
    key: 'bsc-maintenance',
    start: 'Thu, 7 Oct 2022 00:00:00 GMT',
    end: 'Thu, 7 Oct 2022 00:00:00 GMT',
    onlyChains: [ChainId.BSCMAINNET],
    text: [
      'BNB Chain is currently under maintenance and has been paused temporarily. For further info please refer to ',
      {
        text: 'this',
        link: 'https://twitter.com/BNBCHAIN/status/1578148078636650496',
      },
      ' official announcement from the Binance Team.',
    ],
  },
  {
    key: 'ethw',
    start: 'Thu, 13 Sep 2022 00:00:00 GMT',
    end: 'Thu, 13 Oct 2022 00:00:00 GMT',
    onlyChains: [ChainId.ETHW],
    text: [
      'On Ethereum POW, you can withdraw liquidity from pools and make swaps. In the long run, KyberSwap will only maintain support for Ethereum (PoS) as the canonical chain ',
    ],
  },
]

function TopBanner() {
  const below768 = useMedia('(max-width: 768px)')

  const [showBanner, setShowBanner] = useLocalStorage('banners', {})
  const { chainId } = useActiveWeb3React()

  const [show, setShow] = useState<{ [key: string]: boolean | undefined }>({})

  useEffect(() => {
    setTimeout(() => setShow(showBanner || {}), 200)
  }, [showBanner])

  const renderBanner = (banner: Banner) => {
    if (show[banner.key] === false || (chainId && !banner.onlyChains.includes(chainId))) {
      return null
    }

    const now = new Date()
    if (now < new Date(banner.start) || now > new Date(banner.end)) {
      return null
    }

    return (
      <BannerWrapper key={banner.key}>
        {!below768 && <div />}
        <Content>
          <Announcement />
          <Text
            marginLeft="4px"
            marginRight="1rem"
            lineHeight="20px"
            color="#fff"
            fontSize="14px"
            flex={1}
            style={{ whiteSpace: 'break-spaces' }}
          >
            {banner.text.map((textNode, i) => (
              <Fragment key={i}>
                {typeof textNode === 'string' ? (
                  textNode
                ) : (
                  <ExternalLink
                    key={textNode.text + '-' + textNode.link}
                    href={textNode.link}
                    style={{ color: '#fff', fontWeight: 500, textDecoration: 'underline' }}
                  >
                    {textNode.text}
                  </ExternalLink>
                )}
              </Fragment>
            ))}
          </Text>
        </Content>

        <StyledClose size={24} onClick={() => setShowBanner({ ...showBanner, [banner.key]: false })} />
      </BannerWrapper>
    )
  }
  return <>{banners.map(renderBanner)}</>
}

export default TopBanner
