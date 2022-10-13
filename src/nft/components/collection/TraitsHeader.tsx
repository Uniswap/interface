import clsx from 'clsx'
import { Box } from 'nft/components/Box'
import * as styles from 'nft/components/collection/Filters.css'
import { ChevronUpIcon } from 'nft/components/icons'
import { subheadSmall } from 'nft/css/common.css'
import { useTraitsOpen } from 'nft/hooks/useTraitsOpen'
import { ReactNode, useEffect, useState } from 'react'

interface TraitsHeaderProps {
  title: string
  children: ReactNode
  numTraits?: number
  index?: number
}

export const TraitsHeader = (props: TraitsHeaderProps) => {
  const { children, index, title } = props
  const [isOpen, setOpen] = useState(false)
  const traitsOpen = useTraitsOpen((state) => state.traitsOpen)
  const setTraitsOpen = useTraitsOpen((state) => state.setTraitsOpen)

  const prevTraitIsOpen = index !== undefined ? traitsOpen[index - 1] : false
  const showBorderToop = index !== 0

  useEffect(() => {
    if (index !== undefined) {
      setTraitsOpen(index, isOpen)
    }
  }, [isOpen, index, setTraitsOpen])

  return (
    <>
      {showBorderToop && (
        <Box
          className={clsx(subheadSmall, !isOpen && styles.rowHover, styles.detailsOpen)}
          opacity={!prevTraitIsOpen && isOpen && index !== 0 ? '1' : '0'}
          marginTop={prevTraitIsOpen ? '0' : '8'}
        />
      )}

      <Box as="details" className={clsx(subheadSmall, !isOpen && styles.rowHover)} open={isOpen}>
        <Box
          as="summary"
          className={clsx(isOpen ? styles.rowHoverOpen : styles.rowHover)}
          display="flex"
          justifyContent="space-between"
          cursor="pointer"
          alignItems="center"
          fontSize="16"
          paddingTop="10"
          paddingLeft="12"
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
                marginRight: -1,
              }}
            >
              <ChevronUpIcon className={styles.chevronIcon} />
            </Box>
          </Box>
        </Box>
        {children}
      </Box>
    </>
  )
}
