import jazzicon from '@metamask/jazzicon'
import useENSAvatar from 'hooks/useENSAvatar'
import { useCallback, useState } from 'react'
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
  const { account } = useActiveWeb3React()
  const { avatar } = useENSAvatar(account ?? undefined)
  const [fetchable, setFetchable] = useState(true)

  const setJazzicon = useCallback(
    (ref: HTMLSpanElement | null) => {
      if (account) {
        ref?.appendChild(jazzicon(16, parseInt(account?.slice(2, 10), 16)))
      }
    },
    [account]
  )

  return (
    <StyledIdenticon>
      {avatar && fetchable ? (
        <StyledAvatar alt="avatar" src={avatar} onError={() => setFetchable(false)}></StyledAvatar>
      ) : (
        <span
          ref={setJazzicon}
          key={account} // forces re-render when account changes so that React controls jazzicon cleanup
        />
      )}
    </StyledIdenticon>
  )
}
