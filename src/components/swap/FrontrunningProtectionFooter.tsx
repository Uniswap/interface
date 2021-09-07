import styled from 'styled-components/macro'
import { TYPE } from '../../theme'
import FlashbotsLogo from '../../assets/images/flashbots.png'
const DetailsFooter = styled.div`
  padding: 0 20px 20px 20px;
  width: 100%;
  max-width: 400px;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  color: ${({ theme }) => theme.text2};
  background-color: ${({ theme }) => theme.advancedBG};
  display: flex;
`
const StyledLogo = styled.img`
  height: 46px;
  width: 46px;
  margin-right: 8px;
  margin-top: 20px;
`

const Description = styled.div`
  padding-top: 16px;
`

export default function FrontrunningProtectionFooter() {
  return (
    <DetailsFooter>
      <StyledLogo src={FlashbotsLogo} />
      <Description>
        <TYPE.black fontWeight={500}>Frontrunning Protection</TYPE.black>
        <TYPE.italic marginTop="4px">
          Your transactions are protected from frontrunning attacks using Flashbots & mistX
        </TYPE.italic>
      </Description>
    </DetailsFooter>
  )
}
