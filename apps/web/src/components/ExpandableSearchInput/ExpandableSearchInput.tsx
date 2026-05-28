import { useState } from 'react'
import { Flex, IconButton, Input } from 'ui/src'
import { Search } from 'ui/src/components/icons/Search'
import { X } from 'ui/src/components/icons/X'
import { zIndexes } from 'ui/src/theme'
import { transitions } from '~/theme/styles'

interface ExpandableSearchInputProps {
  value: string
  onChangeText: (value: string) => void
  placeholder?: string
  onFocus?: () => void
  onBlur?: () => void
  onClose?: () => void
  /** Control open state externally. If not provided, managed internally. */
  isOpen?: boolean
  /** Responsive props for medium breakpoint */
  responsive?: boolean
  'data-testid'?: string
}

export function ExpandableSearchInput({
  value,
  onChangeText,
  placeholder,
  onFocus,
  onBlur,
  onClose,
  isOpen: isOpenProp,
  responsive,
  'data-testid': dataTestId,
}: ExpandableSearchInputProps) {
  const [isOpenInternal, setIsOpenInternal] = useState(false)
  const isOpen = isOpenProp ?? isOpenInternal

  const handleFocus = () => {
    setIsOpenInternal(true)
    onFocus?.()
  }

  const handleBlur = () => {
    if (value === '') {
      setIsOpenInternal(false)
    }
    onBlur?.()
  }

  const handleClose = () => {
    setIsOpenInternal(false)
    onChangeText('')
    onClose?.()
  }

  return (
    <Flex
      {...(responsive
        ? {
            $md: {
              position: isOpen ? 'absolute' : 'relative',
              width: isOpen ? '100%' : 'auto',
              left: 0,
              right: 0,
              zIndex: zIndexes.mask,
              height: 40,
            },
          }
        : {})}
      centered
      alignSelf="stretch"
    >
      <Flex
        position="absolute"
        left="$spacing12"
        top={0}
        bottom={0}
        alignItems="center"
        justifyContent="center"
        pointerEvents="none"
      >
        <Search size="$icon.20" color="$neutral1" />
      </Flex>
      <Input
        data-testid={dataTestId}
        placeholder={placeholder}
        placeholderTextColor="$neutral3"
        autoComplete="off"
        value={value}
        onChangeText={onChangeText}
        backgroundColor="$surface1"
        borderRadius={12}
        borderWidth="$spacing1"
        borderColor={isOpen ? '$accent1' : '$surface3'}
        height="100%"
        width={isOpen ? 200 : 0}
        pl={34}
        pr={isOpen ? 30 : undefined}
        color="$neutral2"
        textOverflow="ellipsis"
        onFocus={handleFocus}
        onBlur={handleBlur}
        $platform-web={{
          transitionDuration: transitions.duration.fast,
          transitionProperty: 'width',
        }}
        focusStyle={{
          backgroundColor: '$surface1',
          borderColor: '$accent1',
          color: '$neutral1',
        }}
        hoverStyle={{
          borderColor: '$surface3Hovered',
          cursor: 'pointer',
        }}
        {...(responsive
          ? {
              $md: {
                '$platform-web': {
                  transitionDuration: 'initial',
                },
                width: isOpen ? '100%' : 0,
              },
            }
          : {})}
      />
      {isOpen && (
        <Flex row centered position="absolute" right={6} zIndex={zIndexes.mask}>
          <IconButton size="xxsmall" emphasis="secondary" onPress={handleClose} icon={<X />} p={3} scale={0.8} />
        </Flex>
      )}
    </Flex>
  )
}
