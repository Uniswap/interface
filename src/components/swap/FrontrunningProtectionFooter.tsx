import styled from 'styled-components/macro'
import { TYPE } from '../../theme'
const DetailsFooter = styled.div`
  padding: 6px;
  width: 100%;
  max-width: 400px;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  color: ${({ theme }) => theme.text2};
  background-color: ${({ theme }) => theme.advancedBG};
  text-align: center;
`

export default function FrontrunningProtectionFooter() {
  return (
    <DetailsFooter>
      <TYPE.italic>Frontrunning Protection: On</TYPE.italic>
    </DetailsFooter>
  )
}
