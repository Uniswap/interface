import Web3Status from 'components/Web3Status'
import { useWindowSize } from 'hooks/useWindowSize'

import { breakpoints } from '../../nft/css/sprinkles.css'
import WalletDropdown from '../WalletDropdown'
import * as styles from './Navbar.css'

const MobileNavbar = () => {
  return (
    <>
      <nav className={styles.nav} />

      <div className={styles.mobileWalletContainer}>
        <Web3Status />
        <div style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)' }}>
          <WalletDropdown />
        </div>
      </div>
    </>
  )
}

const Navbar = () => {
  const { width: windowWidth } = useWindowSize()

  if (windowWidth && windowWidth < breakpoints.desktopXl) {
    return <MobileNavbar />
  }

  return (
    <div style={{ position: 'absolute', right: 50, top: 20 }}>
      <WalletDropdown />
    </div>
  )
}

export default Navbar
