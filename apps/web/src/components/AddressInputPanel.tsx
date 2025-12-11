import { AutoColumn } from 'components/deprecated/Column'
import { RowBetween } from 'components/deprecated/Row'
import { useAccount } from 'hooks/useAccount'
import { deprecatedStyled } from 'lib/styled-components'
import { ChangeEvent, ReactNode, useCallback } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { ExternalLink } from 'theme/components/Links'
import { flexColumnNoWrap } from 'theme/styles'
import { Text, useSporeColors } from 'ui/src'
import { useENS } from 'uniswap/src/features/ens/useENS'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'

const InputPanel = deprecatedStyled.div`
  ${flexColumnNoWrap};
  position: relative;
  border-radius: 1.25rem;
  background-color: ${({ theme }) => theme.surface1};
  z-index: 1;
  width: 100%;
`

const ContainerRow = deprecatedStyled.div<{ error: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 1.25rem;
  border: 1px solid ${({ error, theme }) => (error ? theme.critical : theme.surface3)};
  transition:
    border-color 300ms ${({ error }) => (error ? 'step-end' : 'step-start')},
    color 500ms ${({ error }) => (error ? 'step-end' : 'step-start')};
  background-color: ${({ theme }) => theme.surface1};
`

const InputContainer = deprecatedStyled.div`
  flex: 1;
  padding: 1rem;
`

const Input = deprecatedStyled.input<{ error?: boolean }>`
  font-size: 1.25rem;
  outline: none;
  border: none;
  flex: 1 1 auto;
  width: 0;
  background-color: ${({ theme }) => theme.surface1};
  transition: color 300ms ${({ error }) => (error ? 'step-end' : 'step-start')};
  color: ${({ error, theme }) => (error ? theme.critical : theme.neutral1)};
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 535;
  width: 100%;
  ::placeholder {
    color: ${({ theme }) => theme.neutral3};
  }
  padding: 0px;
  -webkit-appearance: textfield;

  ::-webkit-search-decoration {
    -webkit-appearance: none;
  }

  ::-webkit-outer-spin-button,
  ::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }

  ::placeholder {
    color: ${({ theme }) => theme.neutral3};
  }
`

export default function AddressInputPanel({
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
          <AutoColumn gap="md">
            <RowBetween>
              <Text variant="body1" color={colors.neutral2.val}>
                {label ?? <Trans i18nKey="addressInput.recipient" />}
              </Text>
              {address && chainId && (
                <ExternalLink
                  href={getExplorerLink({ chainId, data: name ?? address, type: ExplorerDataType.ADDRESS })}
                  style={{ fontSize: '14px' }}
                >
                  (<Trans i18nKey="common.viewOnExplorer" />)
                </ExternalLink>
              )}
            </RowBetween>
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
          </AutoColumn>
        </InputContainer>
      </ContainerRow>
    </InputPanel>
  )
}
