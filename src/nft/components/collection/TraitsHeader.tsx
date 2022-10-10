import clsx from 'clsx'
import { Box } from 'nft/components/Box'
import * as styles from 'nft/components/collection/Filters.css'
import { ChevronUpIcon } from 'nft/components/icons'
import { subheadSmall } from 'nft/css/common.css'
import { ReactNode, useState } from 'react'
import { themeVars } from 'nft/css/sprinkles.css'

interface TraitsHeaderProps {
  title: string
  children: ReactNode
  numTraits?: number
  showBorderTop?: boolean
}

export const TraitsHeader = (props: TraitsHeaderProps) => {
  const { children, showBorderTop, title } = props
  const [isOpen, setOpen] = useState(false)

  return (
    <Box
      as="details"
      className={clsx(
        subheadSmall,
        showBorderTop && styles.borderTop,
        !isOpen && styles.rowHover,
        isOpen && styles.detailsOpen
      )}
      open={isOpen}
      style={{
        borderBottom: isOpen ? `1px solid ${themeVars.colors.backgroundOutline}` : undefined,
      }}
      borderRadius="12"
    >
      <Box
        as="summary"
        className={clsx(isOpen ? styles.rowHoverOpen : styles.rowHover)}
        display="flex"
        justifyContent="space-between"
        cursor="pointer"
        alignItems="center"
        fontSize="16"
        paddingTop="10"
        paddingLeft="8"
        paddingBottom="10"
        paddingRight="16"
        borderRadius="12"
        lineHeight="20"
        onClick={(e) => {
          e.preventDefault()
          setOpen(!isOpen)
        }}
      >
        {title}

        <Box display="flex" alignItems="center">
          <Box color="textTertiary" display="inline-block" marginRight="12">
            {props.numTraits}
          </Box>
          <Box
            color="textSecondary"
            display="inline-block"
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
      </Box>
      {children}
    </Box>
  )
}
