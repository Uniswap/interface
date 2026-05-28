import { Select, styled } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { zIndexes } from 'ui/src/theme'

interface FeatureFlagSelectOption {
  value: string
  label: string
}

/** Normalize options to { value, label }[] for display */
function normalizeOptions(
  options: Array<string | number> | Record<string, string | number> | FeatureFlagSelectOption[],
): FeatureFlagSelectOption[] {
  if (Array.isArray(options)) {
    return options.map((opt) => {
      if (typeof opt === 'string' || typeof opt === 'number') {
        return { value: String(opt), label: String(opt) }
      }
      const o = opt as FeatureFlagSelectOption
      return { value: String(o.value), label: o.label }
    })
  }
  return Object.entries(options).map(([key, value]) => ({ value: String(value), label: key }))
}

const SelectTrigger = styled(Select.Trigger, {
  borderRadius: '$rounded12',
  padding: '$padding8',
  backgroundColor: '$surface3',
  fontWeight: '535',
  fontSize: 16,
  borderWidth: 0,
  color: '$neutral1',
  maxWidth: 'max-content',
})

interface FeatureFlagSelectorProps {
  value: string
  onValueChange: (value: string) => void
  options: Array<string | number> | Record<string, string | number> | FeatureFlagSelectOption[]
  id?: string
  placeholder?: string
  /** Trigger width; default 125 */
  width?: number | string
}

export function FeatureFlagSelector({
  value,
  onValueChange,
  options,
  id,
  placeholder,
  width = 125,
}: FeatureFlagSelectorProps): JSX.Element {
  const items = normalizeOptions(options)

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger id={id} width={width} iconAfter={<RotatableChevron direction="down" />}>
        <Select.Value placeholder={placeholder} />
      </SelectTrigger>
      <Select.Content zIndex={zIndexes.popover}>
        <Select.Viewport borderRadius="$rounded12">
          {items.map((opt, i) => (
            <Select.Item key={opt.value} index={i} value={opt.value}>
              <Select.ItemText>{opt.label}</Select.ItemText>
            </Select.Item>
          ))}
        </Select.Viewport>
      </Select.Content>
    </Select>
  )
}
