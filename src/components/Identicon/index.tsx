import Davatar from '@davatar/react'
import styled from 'styled-components/macro'

import { useActiveWeb3React } from '../../hooks/web3'

const StyledIdenticonContainer = styled.div`
  margin: 0 8px;
`

export default function Identicon() {
  const { account, library } = useActiveWeb3React()

  // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30451
  return (
    <StyledIdenticonContainer>
      {account && library?.provider && <Davatar address={account} size={20} provider={library.provider} />}
    </StyledIdenticonContainer>
  )
}
