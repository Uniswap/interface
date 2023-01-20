import clsx from 'clsx'
import { Box } from 'nft/components/Box'
import * as styles from 'nft/components/collection/Filters.css'
import { Column, Row } from 'nft/components/Flex'
import { ChevronUpIcon } from 'nft/components/icons'
import { subheadSmall } from 'nft/css/common.css'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

const FilterItemWrapper = styled(Row)`
  justify-content: space-between;
  padding: 10px 16px 10px 12px;
  cursor: pointer;
  border-radius: 12px;
  &:hover {
    background: ${({ theme }) => theme.backgroundInteractive};
  }
`

export const FilterItem = ({
  title,
  element,
  onClick,
}: {
  title: string | JSX.Element
  element: JSX.Element
  onClick: React.MouseEventHandler<HTMLElement>
}) => {
  return (
    <FilterItemWrapper onClick={onClick}>
      <ThemedText.BodyPrimary>{title}</ThemedText.BodyPrimary>
      <ThemedText.SubHeaderSmall>{element}</ThemedText.SubHeaderSmall>
    </FilterItemWrapper>
  )
}

export const FilterDropdown = ({
  title,
  items,
  onClick,
  isOpen,
}: {
  title: string
  items: JSX.Element[]
  onClick: React.MouseEventHandler<HTMLElement>
  isOpen: boolean
}) => {
  return (
    <>
      <Box className={styles.detailsOpen} opacity={isOpen ? '1' : '0'} />
      <Box
        as="details"
        className={clsx(subheadSmall, !isOpen && styles.rowHover)}
        open={isOpen}
        borderRadius={isOpen ? '0' : '12'}
      >
        <Box
          as="summary"
          className={`${styles.row} ${styles.rowHover}`}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          fontSize="16"
          paddingTop="12"
          paddingLeft="12"
          paddingBottom="12"
          lineHeight="20"
          borderRadius="12"
          maxHeight="48"
          onClick={onClick}
        >
          {title}
          <Box display="flex" alignItems="center">
            <Box
              className={styles.chevronContainer}
              style={{
                transform: `rotate(${isOpen ? 0 : 180}deg)`,
              }}
            >
              <ChevronUpIcon className={styles.chevronIcon} />
            </Box>
          </Box>
        </Box>
        <Column className={styles.filterDropDowns} paddingBottom="8" paddingLeft="0">
          {items}
        </Column>
      </Box>
    </>
  )
}
