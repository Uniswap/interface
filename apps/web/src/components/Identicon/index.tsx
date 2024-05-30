import { UniTagProfilePicture } from 'components/UniTag/UniTagProfilePicture'
import { Unicon } from 'components/Unicon'
import useENSAvatar from 'hooks/useENSAvatar'
import { Loader } from 'react-feather'
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

  if (!account) return undefined
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

export default function Identicon({ account, size }: { account?: string; size: number }) {
  const identiconType = useIdenticonType(account)
  if (!account) return null

  switch (identiconType) {
    case IdenticonType.LOADING:
      return <Loader data-testid="IdenticonLoader" size={size + 'px'} />
    case IdenticonType.UNITAG_PROFILE_PICTURE:
      return <UniTagProfilePicture account={account} size={size} />
    case IdenticonType.ENS_AVATAR:
      return <ENSAvatarIcon account={account} size={size} />
    case IdenticonType.UNICON_V2:
      return <UniconV2 address={account} size={size} />
    case IdenticonType.UNICON:
      return <Unicon address={account} size={size} />
    default:
      return null
  }
}
