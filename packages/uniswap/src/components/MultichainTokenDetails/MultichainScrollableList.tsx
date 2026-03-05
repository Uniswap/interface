import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, useSporeColors } from 'ui/src'
import { opacify } from 'ui/src/theme'
import type { MultichainTokenEntry } from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'

const GRADIENT_THRESHOLD = 4

export interface MultichainScrollableListProps {
  data: MultichainTokenEntry[]
  renderItem: (entry: MultichainTokenEntry, index: number) => JSX.Element
  /**
   * When true, skips the internal ScrollView wrapper because the parent
   * provides its own scrollable container (e.g. BottomSheetScrollView on native).
   */
  renderedInModal?: boolean
}

/**
 * Shared scrollable container for multichain list components.
 * When rendered inside a native bottom-sheet Modal, set renderedInModal=true
 * so the parent BottomSheetScrollView handles scrolling instead.
 */
export function MultichainScrollableList({
  data,
  renderItem,
  renderedInModal,
}: MultichainScrollableListProps): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const isEmpty = data.length === 0
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showBottomGradient, setShowBottomGradient] = useState(true)

  const updateGradient = useCallback(() => {
    const el = scrollRef.current
    if (!el) {
      return
    }
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= GRADIENT_THRESHOLD
    setShowBottomGradient(!isAtBottom)
  }, [])

  useEffect(() => {
    if (renderedInModal) {
      return undefined
    }
    const el = scrollRef.current
    if (!el) {
      return undefined
    }
    el.addEventListener('scroll', updateGradient)
    updateGradient()
    return () => el.removeEventListener('scroll', updateGradient)
  }, [renderedInModal, updateGradient])

  const items = (
    <Flex gap="$spacing2" py="$spacing8" $md={{ gap: '$spacing4' }}>
      {data.map((entry, index) => (
        <Fragment key={entry.chainId}>{renderItem(entry, index)}</Fragment>
      ))}
      {isEmpty && (
        <Flex px="$spacing8" py="$spacing12">
          <Text color="$neutral3" variant="body3">
            {t('common.noResults')}
          </Text>
        </Flex>
      )}
    </Flex>
  )

  if (renderedInModal) {
    return items
  }

  return (
    <Flex position="relative" overflow="hidden" flex={1} $md={{ flex: 0 }}>
      <Flex ref={scrollRef} overflow="scroll" scrollbarWidth="none" flex={1}>
        {items}
      </Flex>
      {/* Bottom fade gradient (desktop web popover only, hidden when scrolled to bottom) */}
      {showBottomGradient && (
        <Flex
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          height={64}
          pointerEvents="none"
          $md={{ display: 'none' }}
          style={{
            background: `linear-gradient(180deg, ${opacify(0, colors.surface1.val)} 0%, ${opacify(60, colors.surface1.val)} 100%)`,
          }}
        />
      )}
    </Flex>
  )
}
