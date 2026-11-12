import { Flex, IconButton, Input, zIndexes } from '@universe/mycelium'
import { Search } from '@universe/mycelium/icons/Search'
import { X } from '@universe/mycelium/icons/X'
import { type Ref, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { transitions } from '~/theme/styles'

// Left padding that clears the absolutely-positioned search glyph.
const SEARCH_GLYPH_INSET = 34
// Trailing padding while collapsed. Stated rather than left to the Input's own default so the
// exported width below stays true to what renders.
const SEARCH_COLLAPSED_RIGHT_PAD = 8
const SEARCH_BORDER_WIDTH = 1
/**
 * The collapsed control's rendered width (44px): its horizontal padding plus both borders. The
 * `width` below is 0 when collapsed, but `box-sizing: border-box` clamps the used width up to
 * exactly that sum. Exported so sibling toolbar icon buttons can match this footprint.
 */
export const COLLAPSED_SEARCH_WIDTH = SEARCH_GLYPH_INSET + SEARCH_COLLAPSED_RIGHT_PAD + SEARCH_BORDER_WIDTH * 2
export const WIDE_SEARCH_WIDTH = 344

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
  /** Keeps the input expanded at this width outside responsive mobile mode, without forcing focus. */
  alwaysExpandedWidth?: number
  'data-testid'?: string
  'aria-label'?: string
  inputRef?: Ref<Input>
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
  alwaysExpandedWidth,
  'data-testid': dataTestId,
  'aria-label': ariaLabel,
  inputRef,
}: ExpandableSearchInputProps) {
  const { t } = useTranslation()
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
        ref={inputRef}
        data-testid={dataTestId}
        aria-label={ariaLabel}
        placeholder={placeholder}
        placeholderTextColor="$neutral2"
        autoComplete="off"
        value={value}
        onChangeText={onChangeText}
        backgroundColor="$surface1"
        borderRadius={12}
        borderWidth={SEARCH_BORDER_WIDTH}
        borderColor={isOpen ? '$accent1' : '$surface3'}
        height="100%"
        width={alwaysExpandedWidth ?? (isOpen ? 200 : 0)}
        pl={SEARCH_GLYPH_INSET}
        pr={isOpen ? 30 : SEARCH_COLLAPSED_RIGHT_PAD}
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
          <IconButton
            size="xxsmall"
            emphasis="secondary"
            onPress={handleClose}
            icon={<X />}
            aria-label={t('common.clear')}
            p={3}
            scale={0.8}
          />
        </Flex>
      )}
    </Flex>
  )
}
