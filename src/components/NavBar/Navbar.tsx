import Web3Status from 'components/Web3Status'
import { useWindowSize } from 'hooks/useWindowSize'
import { Box } from 'nft/components/Box'
import { Row } from 'nft/components/Flex'

import { breakpoints } from '../../nft/css/sprinkles.css'
import * as styles from './Navbar.css'
import { SearchBar } from './SearchBar'

const MobileNavbar = () => {
  return (
    <>
      <nav className={styles.nav} />
      <Box display="flex" height="full" flexWrap="nowrap" alignItems="stretch">
        <Box className={styles.rightSideMobileContainer}>
          <Row gap="16">
            <SearchBar />
          </Row>
        </Box>
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
      <Box display="flex" height="full" flexWrap="nowrap" alignItems="stretch">
        <Box className={styles.middleContainer}>
          <SearchBar />
        </Box>
      </Box>
    </nav>
  )
}

export default Navbar
