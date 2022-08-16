import Web3Status from 'components/Web3Status'
import { useWindowSize } from 'hooks/useWindowSize'
import { Box } from 'nft/components/Box'
import { Row } from 'nft/components/Flex'

import { breakpoints } from '../../nft/css/sprinkles.css'
import { ChainSwitcher } from './ChainSwitcher'
import * as styles from './Navbar.css'

const MobileNavbar = () => {
  return (
    <>
      <nav className={styles.nav} />
      <Box className={styles.leftSideMobileContainer}>
        <ChainSwitcher isMobile={true} />
      </Box>
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

  return (
    <nav className={styles.nav}>
      <Box className={styles.rightSideContainer}>
        <Row gap="12">
          <ChainSwitcher />
        </Row>
      </Box>
    </nav>
  )
}

export default Navbar
