import Web3Status from 'components/Web3Status'
import { useWindowSize } from 'hooks/useWindowSize'

import { breakpoints } from '../../nft/css/sprinkles.css'
import * as styles from './Navbar.css'
import WalletDropdown from '../WalletDropdown'

const MobileNavbar = () => {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 50,
        left: '50%',
        transform: 'translateX(-50%)',
      }}
    >
      <div>
        <WalletDropdown />
      </div>
    </div>
  )
}

const Navbar = () => {
  const { width: windowWidth } = useWindowSize()

  if (windowWidth && windowWidth < breakpoints.desktopXl) {
    return <MobileNavbar />
  }

  return <WalletDropdown />
}

export default Navbar
