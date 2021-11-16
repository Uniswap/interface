import jazzicon from '@metamask/jazzicon'
import useENSAvatar from 'hooks/useENSAvatar'
import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components/macro'

import { useActiveWeb3React } from '../../hooks/web3'

const StyledIdenticon = styled.div`
  height: 1rem;
  width: 1rem;
  border-radius: 1.125rem;
  background-color: ${({ theme }) => theme.bg4};
  font-size: initial;
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
  const [fetchable, setFetchable] = useState(true)

  useEffect(() => {
    if ((!avatar || !fetchable) && account) {
      const icon = jazzicon(16, parseInt(account?.slice(2, 10), 16))
      const current = ref.current
      current?.appendChild(icon)
      return () => {
        current?.removeChild(icon)
      }
    }
    return
  }, [account, avatar, fetchable])

  return (
    <StyledIdenticon ref={ref}>
      {avatar && fetchable && (
        <StyledAvatar alt="avatar" src={avatar} onError={() => setFetchable(false)}></StyledAvatar>
      )}
    </StyledIdenticon>
  )
}
