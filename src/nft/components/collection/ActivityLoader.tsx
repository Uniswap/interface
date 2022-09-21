import { Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'

import { HeaderRow } from './Activity'
import { eventRow } from './Activity.css'
import * as styles from './ActivityLoader.css'

const LoadingSquare = () => {
  return <Box className={styles.loadingSquare} />
}

const LoadingSliver = () => {
  return <Box className={styles.loadingSliver} />
}

export const ActivityLoader = () => {
  return (
    <Column marginTop="36">
      <HeaderRow />
      {[...Array(10)].map((_, i) => (
        <Box as="a" className={eventRow} key={i}>
          <Row gap="16">
            <LoadingSquare />
            <LoadingSliver />
          </Row>
          <Row>
            <LoadingSliver />
          </Row>
          <Row display={{ sm: 'none', md: 'flex' }}>
            <LoadingSliver />
          </Row>
          <Row display={{ sm: 'none', lg: 'flex' }}>
            <LoadingSliver />
          </Row>
          <Row display={{ sm: 'none', xl: 'flex' }}>
            <LoadingSliver />
          </Row>
        </Box>
      ))}
    </Column>
  )
}
