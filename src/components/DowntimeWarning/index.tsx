import { useActiveWeb3React } from 'hooks/web3'
import { AlertOctagon } from 'react-feather'
import styled from 'styled-components/macro'

const Root = styled.div`
  background-color: ${({ theme }) => (theme.darkMode ? '#888D9B' : '#CED0D9')};
  border-radius: 18px;
  color: black;
  display: flex;
  flex-direction: row;
  font-size: 14px;
  margin: 12px auto;
  padding: 16px;
  width: 100%;
  max-width: 880px;
`
const WarningIcon = styled(AlertOctagon)`
  display: block;
  margin: auto 16px auto 0;
  min-height: 22px;
  min-width: 22px;
`

export default function DowntimeWarning() {
  const { chainId } = useActiveWeb3React()
  if (!chainId) {
    return null
  }

  return (
    <Root>
      <WarningIcon />
    </Root>
  )
}
