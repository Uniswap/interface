import clsx from 'clsx'
import { useIsMobile } from 'hooks/screenSize/useIsMobile'
import * as styles from 'nft/components/collection/Filters.css'
import { ChevronUpIcon } from 'nft/components/icons'
import { subheadSmall } from 'nft/css/common.css'
import { TraitPosition, useTraitsOpen } from 'nft/hooks/useTraitsOpen'
import { ReactNode, useEffect, useState } from 'react'
import { ClickableTamaguiStyle } from 'theme/components'
import { Flex, Text } from 'ui/src'

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
        <Flex
          className={clsx(subheadSmall, !isOpen && styles.rowHover, styles.detailsOpen)}
          opacity={!prevTraitIsOpen && isOpen && index !== 0 ? 1 : 0}
          mt={prevTraitIsOpen ? 0 : 8}
        />
      )}

      <Flex width="100%">
        <Flex
          row
          width="100%"
          alignItems="center"
          justifyContent="space-between"
          px="$padding12"
          py="$padding8"
          borderRadius="$rounded12"
          onPress={() => setOpen(!isOpen)}
          {...ClickableTamaguiStyle}
          hoverStyle={{ backgroundColor: '$surface3' }}
        >
          <Text variant="body2">{title}</Text>

          <Flex alignItems="center" row gap="$gap8">
            <Text color="$neutral2" mr="12" variant="body2">
              {props.numTraits}
            </Text>
            <Flex className={styles.chevronContainer} transform={`rotate(${isOpen ? 0 : 180}deg)`}>
              <ChevronUpIcon className={styles.chevronIcon} />
            </Flex>
          </Flex>
        </Flex>

        {isOpen && (
          <Flex pr={isMobile ? 16 : 0} pl={isMobile ? 12 : 0}>
            {children}
          </Flex>
        )}
      </Flex>
    </>
  )
}
