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

const ErrorMessage = styled(ThemedText.BodySmall)`
  color: ${({ theme }) => theme.critical};
  margin-top: 8px;
  margin-left: 4px;
`

export default function TextareaPanel({
  id,
  className = '',
  label,
  placeholder,
  fontSize,
  value,
  onChange,
  minHeight,
  isError = false,
  errorMessage,
}: {
  id?: string
  className?: string
  label: ReactNode
  placeholder?: string
  fontSize: string
  minHeight?: string
  value: string
  onChange: (value: string) => void
  isError?: boolean
  errorMessage?: string
}) {
  const theme = useTheme()

  return (
    <InputPanel id={id}>
      <ContainerRow error={isError}>
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
      {isError && errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
    </InputPanel>
  )
}
