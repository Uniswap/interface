import { useWindowSize } from 'hooks/useWindowSize'

import { breakpoints } from '../../nft/css/sprinkles.css'
import * as styles from './Navbar.css'

const MobileNavbar = () => {
  return (
    <>
      <nav className={styles.nav} />
      <div className={styles.mobileWalletContainer}>
        <Wallet />
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
