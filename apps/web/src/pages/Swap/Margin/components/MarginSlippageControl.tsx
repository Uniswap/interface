import { Flex, Input, Text, TouchableArea } from '@universe/mycelium'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useMarginFormStore,
  useMarginFormStoreActions,
} from 'uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore'
import { useEvent } from 'utilities/src/react/hooks'

const MAX_SLIPPAGE_BPS = 1000

function SlippagePresetChip({
  label,
  active,
  bps,
  onSelect,
}: {
  label: string
  active: boolean
  bps: number
  onSelect: (bps: number) => void
}): JSX.Element {
  const onPress = useEvent(() => onSelect(bps))
  return (
    <TouchableArea
      px="$spacing8"
      py="$spacing4"
      borderRadius="$roundedFull"
      backgroundColor={active ? '$accent2' : '$surface3'}
      onPress={onPress}
    >
      <Text variant="buttonLabel4" color={active ? '$accent1' : '$neutral2'}>
        {label}
      </Text>
    </TouchableArea>
  )
}

// Margin-scoped Max-slippage control, shared by the expanded fee row and the tab-row ⚙︎ popover.
export function MarginSlippageControl(): JSX.Element {
  const { t } = useTranslation()
  const slippageToleranceBps = useMarginFormStore((s) => s.slippageToleranceBps)
  const { setMarginFormState } = useMarginFormStoreActions()
  const [draft, setDraft] = useState<string | undefined>(undefined)

  const setSlippage = useEvent((bps: number) => {
    setMarginFormState({ slippageToleranceBps: bps })
  })

  const commitDraft = useEvent(() => {
    if (draft === undefined) {
      return
    }
    const parsed = Number(draft)
    if (Number.isInteger(parsed) && parsed > 0 && parsed <= MAX_SLIPPAGE_BPS) {
      setSlippage(parsed)
    }
    setDraft(undefined)
  })

  return (
    <Flex row alignItems="center" gap="$spacing8" flexWrap="wrap">
      <SlippagePresetChip
        label={`${t('common.auto')} (0.50%)`}
        active={slippageToleranceBps === 50}
        bps={50}
        onSelect={setSlippage}
      />
      <SlippagePresetChip label="0.1%" active={slippageToleranceBps === 10} bps={10} onSelect={setSlippage} />
      <SlippagePresetChip label="1.0%" active={slippageToleranceBps === 100} bps={100} onSelect={setSlippage} />
      <Flex row alignItems="center" gap="$spacing4">
        <Input
          value={draft ?? String(slippageToleranceBps)}
          keyboardType="number-pad"
          width={56}
          height={32}
          px="$spacing8"
          borderWidth={1}
          borderColor="$surface3"
          borderRadius="$rounded8"
          backgroundColor="$transparent"
          color="$neutral1"
          fontSize={13}
          textAlign="right"
          aria-label={t('margin.fees.maxSlippage')}
          onChangeText={setDraft}
          onBlur={commitDraft}
          onSubmitEditing={commitDraft}
        />
        <Text variant="body4" color="$neutral2">
          bps
        </Text>
      </Flex>
    </Flex>
  )
}
