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

const ActivityLoadingRow = () => {
  return (
    <Box as="a" className={eventRow}>
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
  )
}

export const ActivityPageLoader = ({ rowCount }: { rowCount: number }) => {
  return (
    <>
      {[...Array(rowCount)].map((_, index) => (
        <ActivityLoadingRow key={index} />
      ))}
    </>
  )
}

export const ActivityLoader = () => {
  return (
    <Column marginTop="36">
      <HeaderRow />
      <ActivityPageLoader rowCount={10} />
    </Column>
  )
}
