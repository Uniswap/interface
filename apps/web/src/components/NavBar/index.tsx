import LegacyNavbar from 'components/NavBar/LEGACY/index'
import { RefreshedNavbar } from 'components/NavBar/NavBar'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

const Navbar = ({ blur }: { blur: boolean }) => {
  return useFeatureFlag(FeatureFlags.NavRefresh) ? <RefreshedNavbar /> : <LegacyNavbar blur={blur} />
}

export default Navbar
