import jazzicon from '@metamask/jazzicon'
import { useWeb3React } from '@web3-react/core'
import { NavBarVariant, useNavBarFlag } from 'featureFlags/flags/navBar'
import useENSAvatar from 'hooks/useENSAvatar'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components/macro'

const StyledIdenticon = styled.div<{ isNavbarEnabled: boolean }>`
  height: ${({ isNavbarEnabled }) => (isNavbarEnabled ? '24px' : '1rem')};
  width: ${({ isNavbarEnabled }) => (isNavbarEnabled ? '24px' : '1rem')};
  border-radius: 1.125rem;
  background-color: ${({ theme }) => theme.deprecated_bg4};
  font-size: initial;
`

const StyledAvatar = styled.img`
  height: inherit;
  width: inherit;
  border-radius: inherit;
`

export default function Identicon() {
  const { account } = useWeb3React()
  const { avatar } = useENSAvatar(account ?? undefined)
  const [fetchable, setFetchable] = useState(true)
  const isNavbarEnabled = useNavBarFlag() === NavBarVariant.Enabled
  const iconSize = isNavbarEnabled ? 24 : 16

  const icon = useMemo(() => account && jazzicon(iconSize, parseInt(account.slice(2, 10), 16)), [account, iconSize])
  const iconRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const current = iconRef.current
    if (icon) {
      current?.appendChild(icon)
      return () => {
        try {
          current?.removeChild(icon)
        } catch (e) {
          console.error('Avatar icon not found')
        }
      }
    }
    return
  }, [icon, iconRef])

  return (
    <StyledIdenticon isNavbarEnabled={isNavbarEnabled}>
      {avatar && fetchable ? (
        <StyledAvatar alt="avatar" src={avatar} onError={() => setFetchable(false)}></StyledAvatar>
      ) : (
        <span ref={iconRef} />
      )}
    </StyledIdenticon>
  )
}
