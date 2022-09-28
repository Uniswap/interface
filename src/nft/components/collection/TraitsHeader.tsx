import { useState, ReactNode } from 'react'
import * as styles from 'nft/components/collection/Filters.css'
import { subheadSmall } from 'nft/css/common.css'
import { Box } from 'nft/components/Box'
import clsx from 'clsx'
import { ChevronUpIcon } from 'nft/components/icons'

interface TraitsHeaderProps {
  title: string
  children: ReactNode
  showBorderBottom?: boolean
}

export const TraitsHeader = (props: TraitsHeaderProps) => {
  const { children, showBorderBottom, title } = props
  const [isOpen, setOpen] = useState(false)

  return (
    <Box
      as="details"
      className={clsx(subheadSmall, !isOpen && styles.rowHover, isOpen && styles.detailsOpen)}
      style={{ borderTop: '1px solid #99A1BD3D', borderBottom: showBorderBottom ? '1px solid #99A1BD3D' : 'none' }}
      open={isOpen}
    >
      <Box
        as="summary"
        className={clsx(isOpen && styles.summaryOpen, isOpen ? styles.rowHoverOpen : styles.rowHover)}
        display="flex"
        justifyContent="space-between"
        cursor="pointer"
        alignItems="center"
        fontSize="14"
        paddingTop="8"
        paddingLeft="12"
        paddingRight="12"
        paddingBottom="8"
        onClick={(e) => {
          e.preventDefault()
          setOpen(!isOpen)
        }}
      >
        {title}
        <Box
          color="textSecondary"
          transition="250"
          height="28"
          width="28"
          style={{
            transform: `rotate(${isOpen ? 0 : 180}deg)`,
          }}
        >
          <ChevronUpIcon />
        </Box>
      </Box>
      {children}
    </Box>
  )
}
