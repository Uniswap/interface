import { UniTagProfilePicture } from 'components/UniTag/UniTagProfilePicture'
import { Unicon } from 'components/Unicon'
import useENSAvatar from 'hooks/useENSAvatar'
import { Loader } from 'react-feather'
import { UniconV2 } from 'ui/src/components/UniconV2'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useUnitagByAddress } from 'uniswap/src/features/unitags/hooks'
import ENSAvatarIcon from './ENSAvatarIcon'

export default function Identicon({ account, size }: { account?: string; size: number }) {
  const { unitag, loading: unitagLoading } = useUnitagByAddress(account)
  const { avatar, loading: ensAvatarLoading } = useENSAvatar(account)
  const uniconV2Enabled = useFeatureFlag(FeatureFlags.UniconsV2)

  if (!account) return null
  if (unitagLoading || ensAvatarLoading) {
    return <Loader data-testid="IdenticonLoader" size={size + 'px'} />
  }

  if (unitag?.metadata?.avatar) {
    return <UniTagProfilePicture account={account} size={size} />
  } else if (avatar) {
    return <ENSAvatarIcon account={account} size={size} />
  } else {
    return uniconV2Enabled ? <UniconV2 address={account} size={size} /> : <Unicon address={account} size={size} />
  }
}
