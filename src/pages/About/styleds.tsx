import styled from 'styled-components'
import { Flex } from 'rebass'
import { ButtonPrimary, ButtonOutlined } from 'components/Button'
import bgimg from 'assets/images/about_background.png'

export const Wrapper = styled.div`
  max-width: 960px;
  margin: auto;
  padding: 160px 12px 0;
  padding-bottom: 160px;
  background: transparent;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding-bottom: 100px;
    padding-top: 100px
  `};
`

export const SupportedChain = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 24px;
`

export const BtnOutlined = styled(ButtonOutlined)`
  width: 216px;
  padding: 14px;
  flex: 1;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
  `};
`

export const BtnPrimary = styled(ButtonPrimary)`
  width: 216px;
  padding: 14px;
  flex: 1;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
  `};
`

export const OverflowStatisticWrapper = styled.div`
  margin: 160px calc(400px - 40vw) 0;
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
  margin-top: 160px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    flex-direction: column;
    margin-top: 100px;
  `}
`

export const StatisticItem = styled.div`
  background-color: ${({ theme }) => theme.bg20};
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
  background-color: ${({ theme }) => theme.bg20};
  padding: 20px 0;
  display: flex;
  gap: 24px;
  border-radius: 8px;
  justify-content: center;
  align-items: center;
  border: 1px solid ${({ theme }) => theme.primary};
  position: relative;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    flex-direction: column;
    padding: 20px 16px;
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

  ${({ theme }) => theme.mediaWidth.upToMedium`
    top: 0;
    bottom: -12px;
    left: -1px;
    right: -1px;
  `}
`

export const ForTraderDivider = styled.div<{ horizontal?: boolean }>`
  background-color: ${({ theme }) => theme.border};
  width: ${({ horizontal }) => (horizontal ? '100%' : '1px')};
  height: ${({ horizontal }) => (horizontal ? '1px' : '100%')};
  ${({ theme, horizontal }) => theme.mediaWidth.upToMedium`
    ${!horizontal && 'height: auto;'}
  `}
`

export const ForLiquidityProviderItem = styled(Flex)`
  padding: 48px;
  border-radius: 8px;
  width: 100%;
  background-color: ${({ theme }) => theme.bg20};

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
  max-width: 960px;
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

export const Powered = styled(Flex)`
  img {
    ${({ theme }) => theme.mediaWidth.upToLarge`
      max-width: 120px;
    `}
  }
`

export const AboutPage = styled.div`
  width: 100%;
  background-image: url(${bgimg});
  background-size: contain;
  background-repeat: no-repeat;
  z-index: 1;
  background-color: transparent;
`

export const BackgroundBottom = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100%;
  background-image: url(${bgimg});
  background-size: contain;
  background-repeat: no-repeat;
  background-position: bottom;
  ${({ theme }) => theme.mediaWidth.upToSmall`
      bottom: 500px;
      height: 1000px;
  `}
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
