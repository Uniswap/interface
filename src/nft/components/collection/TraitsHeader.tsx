import clsx from 'clsx'
import { Box } from 'nft/components/Box'
import * as styles from 'nft/components/collection/Filters.css'
import { ChevronUpIcon } from 'nft/components/icons'
import { subheadSmall } from 'nft/css/common.css'
import { ReactNode, useEffect, useState } from 'react'
import { useTraitsOpen } from 'nft/hooks/useTraitsOpen'

interface TraitsHeaderProps {
  title: string
  children: ReactNode
  numTraits?: number
  hideBorderTop?: boolean
  index?: number
}

export const TraitsHeader = (props: TraitsHeaderProps) => {
  const { children, title } = props
  const [isOpen, setOpen] = useState(false)
  const traitsOpen = useTraitsOpen((state) => state.traitsOpen)
  const setTraitsOpen = useTraitsOpen((state) => state.setTraitsOpen)

  const prevTraitIsOpen = props.index !== undefined ? traitsOpen[props.index - 1] : false

  useEffect(() => {
    if (props.index) {
      setTraitsOpen(props.index, isOpen)
    }
  }, [isOpen])

  return (
    <>
      <Box
        className={clsx(
          subheadSmall,
          !isOpen && styles.rowHover,
          isOpen && !prevTraitIsOpen && props.index !== 0 && styles.detailsOpen
        )}
        style={{ marginBottom: 4, marginTop: 4 }}
      />
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
          style={{
            borderRadius: 12,
          }}
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
              <ChevronUpIcon className={styles.chevronIcon} />
            </Box>
          </Box>
        </Box>
        {children}
      </Box>
    </>
  )
}
