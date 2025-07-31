import { LoaderV3 } from 'components/Icons/LoadingSpinner'
import ENSAvatarIcon from 'components/Identicon/ENSAvatarIcon'
import { UnitagProfilePicture } from 'components/UnitagProfilePicture'
import styled from 'lib/styled-components'
import { fadeInAnimation } from 'theme/components/FadePresence'
import { Unicon } from 'ui/src'
import { useUnitagsAddressQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsAddressQuery'
import { useENSAvatar } from 'uniswap/src/features/ens/api'

export enum IdenticonType {
  LOADING = 'loading',
  UNITAG_PROFILE_PICTURE = 'unitagProfilePicture',
  ENS_AVATAR = 'ensAvatar',
  UNICON = 'unicon',
}

export function useIdenticonType(account?: string) {
  const { data: unitag, isLoading: unitagLoading } = useUnitagsAddressQuery({
    params: account ? { address: account } : undefined,
  })
  const { data: avatar, isLoading: ensAvatarLoading } = useENSAvatar(account)

  if (!account) {
    return undefined
  }

  if (unitagLoading) {
    return IdenticonType.LOADING
  } else if (unitag?.metadata?.avatar) {
    return IdenticonType.UNITAG_PROFILE_PICTURE
  } else if (avatar) {
    return IdenticonType.ENS_AVATAR
  } else if (ensAvatarLoading) {
    return IdenticonType.LOADING
  } else {
    return IdenticonType.UNICON
  }
}

const FadeInContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  ${fadeInAnimation}
`

export default function Identicon({ account, size }: { account?: string; size: number }) {
  const identiconType = useIdenticonType(account)
  if (!account) {
    return null
  }

  switch (identiconType) {
    case IdenticonType.LOADING:
      return <LoaderV3 size={size + 'px'} data-testid="IdenticonLoader" />
    case IdenticonType.UNITAG_PROFILE_PICTURE:
      return (
        <FadeInContainer>
          <UnitagProfilePicture account={account} size={size} />
        </FadeInContainer>
      )
    case IdenticonType.ENS_AVATAR:
      return (
        <FadeInContainer>
          <ENSAvatarIcon account={account} size={size} />
        </FadeInContainer>
      )
    case IdenticonType.UNICON:
      return (
        <FadeInContainer>
          <Unicon address={account} size={size} />
        </FadeInContainer>
      )
    default:
      return null
  }
}
