// eslint-disable-next-line no-restricted-imports
import { AutoColumn } from 'components/Column'
import { RowBetween } from 'components/Row'
import { ResizingTextArea } from 'components/TextInput'
import { t } from 'i18n'
import { ReactNode } from 'react'
import styled, { useTheme } from 'styled-components'
import { ThemedText } from 'theme/components'
import { flexColumnNoWrap } from 'theme/styles'

const InputPanel = styled.div`
  ${flexColumnNoWrap};
  position: relative;
  border-radius: 1.25rem;
  background-color: ${({ theme }) => theme.surface1};
  z-index: 1;
  width: 100%;
`

const ContainerRow = styled.div<{ error: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 1.25rem;
  border: 1px solid ${({ error, theme }) => (error ? theme.critical : theme.surface3)};
  transition: border-color 300ms ${({ error }) => (error ? 'step-end' : 'step-start')},
    color 500ms ${({ error }) => (error ? 'step-end' : 'step-start')};
  background-color: ${({ theme }) => theme.surface1};
`

const InputContainer = styled.div`
  flex: 1;
  padding: 1rem;
`

export default function TextInputPanel({
  id,
  className = '',
  label,
  placeholder,
  fontSize,
  value,
  onChange,
  minHeight,
}: {
  id?: string
  className?: string
  label: ReactNode
  placeholder?: string
  fontSize: string
  minHeight?: string
  // the typed string value
  value: string
  // triggers whenever the typed value changes
  onChange: (value: string) => void
}) {
  const theme = useTheme()

  const error = false

  return (
    <InputPanel id={id}>
      <ContainerRow error={error}>
        <InputContainer>
          <AutoColumn gap="md">
            <RowBetween>
              <ThemedText.DeprecatedBlack color={theme.neutral2} fontWeight={535} fontSize={14}>
                {label}
              </ThemedText.DeprecatedBlack>
            </RowBetween>
            <ResizingTextArea
              className={className}
              placeholder={placeholder ?? t`Enter the value`}
              fontSize={fontSize}
              onUserInput={onChange}
              value={value}
              minHeight={minHeight}
            />
          </AutoColumn>
        </InputContainer>
      </ContainerRow>
    </InputPanel>
  )
}
