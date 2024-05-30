import { LoaderV3 } from 'components/Icons/LoadingSpinner'
import { UniTagProfilePicture } from 'components/UniTag/UniTagProfilePicture'
import { Unicon } from 'components/Unicon'
import useENSAvatar from 'hooks/useENSAvatar'
import styled from 'styled-components'
import { fadeInAnimation } from 'theme/components/FadePresence'
import { UniconV2 } from 'ui/src/components/UniconV2'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useUnitagByAddress } from 'uniswap/src/features/unitags/hooks'
import ENSAvatarIcon from './ENSAvatarIcon'

export enum IdenticonType {
  LOADING = 'loading',
  UNITAG_PROFILE_PICTURE = 'unitagProfilePicture',
  ENS_AVATAR = 'ensAvatar',
  UNICON = 'unicon',
  UNICON_V2 = 'uniconV2',
}

export function useIdenticonType(account?: string) {
  const { unitag, loading: unitagLoading } = useUnitagByAddress(account)
  const { avatar, loading: ensAvatarLoading } = useENSAvatar(account)
  const uniconV2Enabled = useFeatureFlag(FeatureFlags.UniconsV2)

  if (!account) {
    return undefined
  }
  if (unitagLoading || ensAvatarLoading) {
    return IdenticonType.LOADING
  } else if (unitag?.metadata?.avatar) {
    return IdenticonType.UNITAG_PROFILE_PICTURE
  } else if (avatar) {
    return IdenticonType.ENS_AVATAR
  } else {
    return uniconV2Enabled ? IdenticonType.UNICON_V2 : IdenticonType.UNICON
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
          <UniTagProfilePicture account={account} size={size} />
        </FadeInContainer>
      )
    case IdenticonType.ENS_AVATAR:
      return (
        <FadeInContainer>
          <ENSAvatarIcon account={account} size={size} />
        </FadeInContainer>
      )
    case IdenticonType.UNICON_V2:
      return (
        <FadeInContainer>
          <UniconV2 address={account} size={size} />
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
