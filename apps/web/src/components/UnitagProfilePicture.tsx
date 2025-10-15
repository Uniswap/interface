import styled from 'lib/styled-components'
import { useUnitagsAddressQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsAddressQuery'

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

export function UnitagProfilePicture({ account, size }: { account?: string; size: number }) {
  const { data: unitag } = useUnitagsAddressQuery({
    params: account ? { address: account } : undefined,
  })

  return (
    <Container $iconSize={size}>
      {unitag?.metadata?.avatar && <Profile alt={unitag.username} src={unitag.metadata.avatar} />}
    </Container>
  )
}
