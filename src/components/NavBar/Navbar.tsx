import Web3Status from 'components/Web3Status'
import { useWindowSize } from 'hooks/useWindowSize'

import { breakpoints } from '../../nft/css/sprinkles.css'
import * as styles from './Navbar.css'

const MobileNavbar = () => {
  return (
    <>
      <nav className={styles.nav} />
      <div className={styles.mobileWalletContainer}>
        <Web3Status />
      </div>
    </>
  )
}

const Navbar = () => {
  const { width: windowWidth } = useWindowSize()

  if (windowWidth && windowWidth < breakpoints.desktopXl) {
    return <MobileNavbar />
  }

  return <nav className={styles.nav} />
}

export default Navbar
