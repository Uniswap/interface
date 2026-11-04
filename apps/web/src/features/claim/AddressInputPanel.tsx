import { Flex, Text } from '@universe/mycelium'
import { styled } from '@universe/mycelium/styled'
import { useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { ChangeEvent, ReactNode, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useENS } from 'uniswap/src/features/ens/useENS'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { useAccount } from '~/connection/hooks/useAccount'
import { ExternalLink } from '~/theme/components/Links'

const InputPanel = styled('div', {
  platform: 'web',
  base: 'flex [flex-flow:column_nowrap] relative rounded-[1.25rem] bg-surface1 z-[1] w-full',
})

const ContainerRow = styled('div', {
  platform: 'web',
  base: 'flex justify-center items-center rounded-[1.25rem] border bg-surface1',
  variants: {
    error: {
      true: 'border-critical [transition:border-color_300ms_step-end,color_500ms_step-end]',
      false: 'border-surface3 [transition:border-color_300ms_step-start,color_500ms_step-start]',
    },
  },
})

const InputContainer = styled('div', {
  platform: 'web',
  base: 'flex-1 p-[1rem]',
})

// No placeholder rule on purpose: the legacy `::placeholder` was written bare, so it compiled to
// the unmatchable descendant `.x ::placeholder` and never applied.
const Input = styled('input', {
  platform: 'web',
  base: 'text-[1.25rem] outline-none border-none flex-[1_1_auto] bg-surface1 overflow-hidden text-ellipsis font-[535] w-full p-0 [-webkit-appearance:textfield] [&::-webkit-search-decoration]:[-webkit-appearance:none] [&::-webkit-outer-spin-button]:[-webkit-appearance:none] [&::-webkit-inner-spin-button]:[-webkit-appearance:none]',
  variants: {
    error: {
      true: 'text-critical [transition:color_300ms_step-end]',
      false: 'text-neutral1 [transition:color_300ms_step-start]',
    },
  },
  defaultVariants: { error: false },
})

export function AddressInputPanel({
  id,
  className = 'recipient-address-input',
  label,
  placeholder,
  value,
  onChange,
}: {
  id?: string
  className?: string
  label?: ReactNode
  placeholder?: string
  // the typed string value
  value: string
  // triggers whenever the typed value changes
  onChange: (value: string) => void
}) {
  const { t } = useTranslation()
  const { chainId } = useAccount()
  const colors = useSporeColors()

  const { address, loading, name } = useENS({ nameOrAddress: value })

  const handleInput = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const input = event.target.value
      const withoutSpaces = input.replace(/\s+/g, '')
      onChange(withoutSpaces)
    },
    [onChange],
  )

  const error = Boolean(value.length > 0 && !loading && !address)

  return (
    <InputPanel id={id}>
      <ContainerRow error={error}>
        <InputContainer>
          <Flex gap="$gap12" width="100%">
            <Flex row width="100%" justifyContent="space-between" alignItems="center">
              <Text variant="body1" color={colors.neutral2.val}>
                {label ?? t('addressInput.recipient')}
              </Text>
              {address && chainId && (
                <ExternalLink
                  href={getExplorerLink({ chainId, data: name ?? address, type: ExplorerDataType.ADDRESS })}
                  style={{ fontSize: '14px' }}
                >
                  ({t('common.viewOnExplorer')})
                </ExternalLink>
              )}
            </Flex>
            <Input
              className={className}
              type="text"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              placeholder={placeholder ?? t('common.addressOrENS')}
              error={error}
              pattern="^(0x[a-fA-F0-9]{40})$"
              onChange={handleInput}
              value={value}
            />
          </Flex>
        </InputContainer>
      </ContainerRow>
    </InputPanel>
  )
}
