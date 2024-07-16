import useENSAvatar from 'hooks/useENSAvatar'
import { useCallback, useState } from 'react'
import styled from 'styled-components'

const StyledAvatarIcon = styled.div<{ iconSize: number }>`
  height: ${({ iconSize }) => `${iconSize}px`};
  width: ${({ iconSize }) => `${iconSize}px`};
  border-radius: 50%;
  background-color: ${({ theme }) => theme.surface3};
  font-size: initial;
`

const StyledAvatar = styled.img`
  height: inherit;
  width: inherit;
  border-radius: inherit;
`

export default function ENSAvatarIcon({ account, size }: { account?: string; size?: number }) {
  const { avatar } = useENSAvatar(account, false)
  const [fetchable, setFetchable] = useState(true)
  const iconSize = size ?? 24

  const handleError = useCallback(() => setFetchable(false), [])

  return (
    <StyledAvatarIcon iconSize={iconSize}>
      {avatar && fetchable && <StyledAvatar alt="avatar" src={avatar} onError={handleError}></StyledAvatar>}
    </StyledAvatarIcon>
  )
}
