import clsx from 'clsx'
import { useIsMobile } from 'hooks/screenSize/useIsMobile'
import { ChevronUpIcon } from 'nft/components/icons'
import { subheadSmall } from 'nft/css/common.css'
import { TraitPosition, useTraitsOpen } from 'nft/hooks/useTraitsOpen'
import { ReactNode, useEffect, useState } from 'react'
import { ClickableTamaguiStyle } from 'theme/components'
import { Flex, Text, useSporeColors } from 'ui/src'

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
  const colors = useSporeColors()

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
          className={clsx(subheadSmall)}
          borderTopColor="$surface3"
          borderTopWidth={1}
          overflow="hidden"
          my="$spacing8"
          hoverStyle={
            isOpen
              ? {}
              : {
                  backgroundColor: '$surface3',
                  borderRadius: '$rounded12',
                }
          }
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
            <Flex
              $platform-web={{ display: 'inline-block' }}
              height="$spacing28"
              width="$spacing28"
              animation="fast"
              mr={-1}
              rotate={isOpen ? '0deg' : '180deg'}
            >
              <ChevronUpIcon fill={colors.neutral2.val} style={{ marginLeft: '-1px' }} />
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
