import styled from 'styled-components'
import { useUnitagByAddressWithoutFlag } from 'uniswap/src/features/unitags/hooksWithoutFlags'

const Container = styled.div<{ $iconSize: number }>`
  height: ${({ $iconSize: iconSize }) => `${iconSize}px`};
  width: ${({ $iconSize: iconSize }) => `${iconSize}px`};
  border-radius: 50%;
  background-color: ${({ theme }) => theme.surface3};
  font-size: initial;
`

const Profile = styled.img`
  height: inherit;
  width: inherit;
  border-radius: inherit;
  object-fit: cover;
`

export function UniTagProfilePicture({ account, size }: { account: string; size: number }) {
  const { unitag } = useUnitagByAddressWithoutFlag(account, Boolean(account))

  return (
    <Container $iconSize={size}>
      {unitag?.metadata?.avatar && <Profile alt={unitag.username} src={unitag.metadata.avatar} />}
    </Container>
  )
}
