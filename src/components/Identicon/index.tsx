import jazzicon from '@metamask/jazzicon'
import useENSAvatar from 'hooks/useENSAvatar'
import { useEffect, useRef } from 'react'
import styled from 'styled-components/macro'

import { useActiveWeb3React } from '../../hooks/web3'

const StyledIdenticonContainer = styled.div`
  height: 1rem;
  width: 1rem;
  border-radius: 1.125rem;
  background-color: ${({ theme }) => theme.bg4};
`

const StyledAvatar = styled.img`
  height: inherit;
  width: inherit;
  border-radius: inherit;
`

export default function Identicon() {
  const ref = useRef<HTMLDivElement>(null)
  const { account } = useActiveWeb3React()
  const { avatar } = useENSAvatar(account ?? undefined)

  useEffect(() => {
    if (!avatar && ref.current) {
      ref.current.innerHTML = ''
      if (account) {
        ref.current.appendChild(jazzicon(16, parseInt(account.slice(2, 10), 16)))
      }
    }
  }, [account, avatar])

  return (
    <StyledIdenticonContainer ref={ref}>
      {avatar && <StyledAvatar alt="avatar" src={avatar}></StyledAvatar>}
    </StyledIdenticonContainer>
  )
}
