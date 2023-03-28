import { useIsDarkMode } from 'state/user/hooks'
import styled from 'styled-components/macro'
import { BREAKPOINTS } from 'theme'

const Banner = styled.div<{ isDarkMode: boolean }>`
  height: 340px;
  width: 100%;
  border-radius: 32px;
  max-width: 1440px;
  margin: 80px 0;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 32px 48px;

  box-shadow: 0px 10px 24px rgba(51, 53, 72, 0.04);

  background: #121211;
  border: 1px;

  @media screen and (min-width: ${BREAKPOINTS.lg}px) {
    height: 140px;
    flex-direction: row;
  }
`

const TextContainer = styled.div`
  color: white;
  display: flex;
  flex: 1;
  flex-direction: column;
`

const HeaderText = styled.div`
  color: white;
  font-weight: 700;
  font-size: 28px;
  line-height: 36px;

  @media screen and (min-width: ${BREAKPOINTS.xl}px) {
    font-size: 28px;
    line-height: 36px;
  }
`

const DescriptionText = styled.div`
  margin: 10px 10px 0 0;
  font-weight: 500;
  font-size: 16px;
  line-height: 20px;
  color: #ed4e33;

  @media screen and (min-width: ${BREAKPOINTS.xl}px) {
    font-size: 20px;
    line-height: 28px;
  }
`
const ProtocolBanner = () => {
  const isDarkMode = useIsDarkMode()
  return (
    <Banner isDarkMode={isDarkMode}>
      <TextContainer>
        <HeaderText color="#ed4e33">Powered by OrbitalApes and the Evmos DAO.</HeaderText>
        <DescriptionText>Community funded. No protocol fees.</DescriptionText>
      </TextContainer>
    </Banner>
  )
}

export default ProtocolBanner
