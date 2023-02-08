import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import bgimg from 'assets/images/about_background.png'
import { ButtonOutlined, ButtonPrimary } from 'components/Button'

export const Wrapper = styled.div`
  max-width: 1228px;
  margin: auto;
  padding: 160px 12px 0;
  padding-bottom: 160px;
  background: transparent;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding-bottom: 100px;
    padding-top: 100px
  `};

  .swiper-pagination-bullet {
    width: 8px;
    border-radius: 8px;
    background: ${({ theme }) => theme.subText};
  }

  .swiper-pagination {
    bottom: -16px !important;
  }

  .swiper-pagination-bullet-active {
    width: 8px;
    border-radius: 8px;
    background: ${({ theme }) => theme.primary};
  }

  .swiper {
    overflow: unset;
  }
`

export const SupportedChain = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;

  gap: 20px;
  margin: auto;
  margin-top: 32px;
`

export const BtnOutlined = styled(ButtonOutlined)`
  width: 216px;
  padding: 12px;
  flex: 1;
  border-radius: 32px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
  `};
`

export const BtnPrimary = styled(ButtonPrimary)`
  width: 216px;
  padding: 10px 12px;
  flex: 1;
  border-radius: 32px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
  `};
`

export const OverflowStatisticWrapper = styled.div`
  margin-top: 160px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    margin-left: 0;
    margin-right: 0;
  `}
`

export const StatisticWrapper = styled.div`
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-direction: row;
  margin-top: 48px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    flex-direction: column;
    margin-top: 100px;
  `}
`

export const StatisticItem = styled.div`
  background-color: ${({ theme }) => theme.background2};
  flex: 1;
  border-radius: 8px;
  text-align: center;
  font-size: 14px;
  padding: 20px 0px;
`

export const ForTrader = styled.div`
  margin-top: 160px;
  gap: 24px;
  display: flex;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    margin-top: 100px;
  `}
`

export const ForTraderInfo = styled(Flex)`
  margin-top: 20px;
  background-color: ${({ theme }) => theme.background2};
  padding: 20px 0;
  border-radius: 8px;
  justify-content: center;
  align-items: center;
  border: 1px solid ${({ theme }) => theme.primary};
  position: relative;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    flex-direction: column;
    padding: 20px 16px;
    gap: 24px;
  `}
`

export const ForTraderInfoShadow = styled.div`
  position: absolute;
  border-radius: 8px;
  background: ${({ theme }) => `${theme.primary}33`};
  top: -1px;
  right: -12px;
  bottom: -1px;
  left: 0;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    top: 0;
    bottom: -12px;
    left: -1px;
    right: -1px;
  `}
`

export const ForTraderDivider = styled.div<{ horizontal?: boolean }>`
  background-color: ${({ theme }) => theme.border};
  width: ${({ horizontal }) => (horizontal ? '100%' : '1px')};
  height: ${({ horizontal }) => (horizontal ? '1px' : '50px')};

  ${({ theme, horizontal }) => theme.mediaWidth.upToMedium`
    ${!horizontal && 'height: auto;'}
  `}
`

export const ForLiquidityProviderItem = styled(Flex)`
  padding: 48px;
  border-radius: 20px;
  width: 100%;
  background-color: ${({ theme }) => theme.background2};

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 32px;
    padding-bottom: 48px;
  `};
`

export const GridWrapper = styled.div`
  display: grid;
  grid-gap: 16px;
  margin-top: 40px;
  padding-bottom: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  grid-auto-flow: column;
  grid-auto-columns: minmax(300px, 1fr);
  overflow-x: auto;
`

export const KyberSwapSlippage = styled.div`
  border-radius: 8px;
  background-color: ${({ theme }) => `${theme.primary}33`};
  padding: 20px 16px 12px;
  text-align: center;
`
export const TypicalAMM = styled.div<{ background?: string }>`
  background-color: ${({ theme, background }) => background || theme.buttonBlack};
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
  padding: 14px 16px 24px;
  text-align: center;
`

export const Footer = styled.div<{ background: string }>`
  background: ${({ theme }) => theme.background};
  width: 100%;
  filter: drop-shadow(0px -4px 16px rgba(0, 0, 0, 0.04));

  ${({ theme }) => theme.mediaWidth.upToLarge`
    margin-bottom: 4rem;
  `};
`

export const FooterContainer = styled.div`
  margin: auto;
  max-width: 1244px;
  padding: 24px;
  font-size: 14px;
  gap: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  a {
    color: ${({ theme }) => theme.subText};
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    justify-content: center;
  `};
`

export const Powered = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin-top: 48px;
  align-items: center;
  justify-content: center;
  gap: 52px;
  & > * {
    width: calc(100% / 6 - 52px);
  }
  svg {
    max-width: 100%;
  }

  ${({ theme }) => theme.mediaWidth.upToMedium`
    & > * {
      width: calc(25% - 52px);
    }
  `}

  ${({ theme }) => theme.mediaWidth.upToSmall`
    & > * {
      width: calc(100% / 3 - 52px);
    }
  `}

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    & > * {
      width: calc(50% - 52px);
    }
  `}
`

export const Exchange = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-top: 48px;
  gap: 52px;
  align-items: center;

  svg {
    max-width: 100%;
  }
`

export const AboutPage = styled.div`
  width: 100%;
  background-image: url(${bgimg}), url(${bgimg});
  background-size: contain, contain;
  background-repeat: no-repeat, no-repeat;
  z-index: 1;
  background-color: transparent, transparent;
  background-position: top, bottom;
`

export const VerticalDivider = styled.div`
  width: 1px;
  height: 0;
  background: ${({ theme }) => theme.border};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    height: auto;
  `}
`

export const CommittedToSecurityDivider = styled.div<{ height?: string }>`
  width: 1px;
  height: ${({ height }) => (height ? height : '80px')};
  background: ${({ theme }) => theme.border};
`

export const AboutKNC = styled.div`
  margin-top: 160px;
  gap: 76px;
  display: flex;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    margin-top: 100px;
  `}
`

export const ExchangeWrapper = styled.div`
  margin: 28px 0px;
  height: 152px;
  background: ${({ theme }) => theme.background2};
  display: flex;
  border-radius: 8px;
`

export const MoreInfoWrapper = styled.div`
  display: flex;
  border-radius: 20px;
  background: ${({ theme }) => theme.background2};
  width: 100%;
  padding: 64px;
  margin-top: 100px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding:48px;
    flex-direction:column;
    align-items:center;
    text-align:center;
  `}
`

export const Tabs = styled.div`
  font-size: 24px;
  display: flex;
  gap: 20px;
  margin-top: 24px;
  align-items: center;
  justify-content: center;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    gap: 12px;
    font-size: 16px;
  `}
`

export const TabItem = styled(Text)<{ active?: boolean }>`
  font-weight: ${({ active }) => (active ? 500 : 400)};
  cursor: pointer;
  color: ${({ theme, active }) => (active ? theme.primary : theme.subText)};
`
