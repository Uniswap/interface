import clsx from 'clsx'
import { Box } from 'nft/components/Box'
import * as styles from 'nft/components/collection/Filters.css'
import { ChevronUpIcon } from 'nft/components/icons'
import { subheadSmall } from 'nft/css/common.css'
import { useIsMobile } from 'nft/hooks'
import { TraitPosition, useTraitsOpen } from 'nft/hooks/useTraitsOpen'
import { ReactNode, useEffect, useState } from 'react'
import styled from 'styled-components/macro'

const ChildreMobileWrapper = styled.div<{ isMobile: boolean }>`
  padding: ${({ isMobile }) => (isMobile ? '0px 16px 0px 12px' : '0px')};
`

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
  const isMobile = useIsMobile()

  const prevTraitIsOpen = index !== undefined ? traitsOpen[index - 1] : false
  const showBorderTop = index !== TraitPosition.TRAIT_START_INDEX

  useEffect(() => {
    if (index !== undefined) {
      setTraitsOpen(index, isOpen)
    }
  }, [isOpen, index, setTraitsOpen])

  return (
    <>
      {showBorderTop && (
        <Box
          className={clsx(subheadSmall, !isOpen && styles.rowHover, styles.detailsOpen)}
          opacity={!prevTraitIsOpen && isOpen && index !== 0 ? '1' : '0'}
          marginTop={prevTraitIsOpen ? '0' : '8'}
        />
      )}

      <Box as="details" className={clsx(subheadSmall, !isOpen && styles.rowHover)} open={isOpen}>
        <Box
          as="summary"
          className={`${styles.row} ${styles.rowHover}`}
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
              className={styles.chevronContainer}
              style={{
                transform: `rotate(${isOpen ? 0 : 180}deg)`,
              }}
            >
              <ChevronUpIcon className={styles.chevronIcon} />
            </Box>
          </Box>
        </Box>
        <ChildreMobileWrapper isMobile={isMobile}>{children}</ChildreMobileWrapper>
      </Box>
    </>
  )
}
