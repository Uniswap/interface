import { MouseoverTooltip } from 'components/Tooltip'
import { Trans } from 'i18n'
import { ChangeEvent, ReactNode, useCallback } from 'react'
import { Info } from 'react-feather'
import styled, { useTheme } from 'styled-components'
import { BREAKPOINTS } from 'theme'
import { ThemedText } from 'theme/components'
import { flexColumnNoWrap, flexRowNoWrap } from 'theme/styles'
import { AutoColumn } from '../Column'
import { RowBetween } from '../Row'

const StyledTokenName = styled.span<{ active?: boolean }>`
  ${({ active }) => (active ? '  margin: 0 0.25rem 0 0.25rem;' : '  margin: 0 0.25rem 0 0.25rem;')}
  font-size: 20px;
  white-space: nowrap;

  @media screen and (max-width: ${BREAKPOINTS.sm}px) {
    font-size: 16px;
  }
`

// Mevcut stil tanımlamaları
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

// index.tsx'ten alınan ve düzenlenen stiller
const InputRow = styled.div<{ hasPostfix?: boolean }>`
  ${flexRowNoWrap};
  align-items: center;
  padding: ${({ hasPostfix }) => (hasPostfix ? '0.75rem 0.5rem 0.75rem 1rem' : '0.75rem 0.75rem 0.75rem 1rem')};
`

const StyledInput = styled.input<{ error?: boolean }>`
  font-size: 1.25rem;
  outline: none;
  border: none;
  flex: 1 1 auto;
  background-color: ${({ theme }) => theme.surface1};
  transition: color 300ms ${({ error }) => (error ? 'step-end' : 'step-start')};
  color: ${({ error, theme }) => (error ? theme.critical : theme.neutral1)};
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 535;
  width: 100%;
  padding: 0;
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

const Postfix = styled(StyledTokenName).attrs({ active: true })`
  color: ${({ theme }) => theme.neutral2};
  user-select: none;
`

const ErrorMessage = styled(ThemedText.BodySmall)`
  color: ${({ theme }) => theme.critical};
  margin-top: 8px;
  margin-left: 4px;
`

const LabelRow = styled.div`
  ${flexRowNoWrap};
  align-items: center;
  color: ${({ theme }) => theme.neutral2};
  font-size: 0.75rem;
  line-height: 1rem;
  padding: 0.75rem 1rem 0 1rem;
`

export default function NumericalInputPanel({
  id,
  className = '',
  label,
  placeholder,
  value,
  onChange,
  isError = false,
  errorMessage,
  postfix,
  showInfo = false,
  infoTooltip = '',
}: {
  id?: string
  className?: string
  label?: ReactNode
  placeholder?: string
  value: string
  onChange: (value: string) => void
  isError?: boolean
  errorMessage?: string
  postfix?: string
  showInfo?: boolean
  infoTooltip?: string
}) {
  const theme = useTheme()

  const handleInput = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const input = event.target.value
      onChange(input)
    },
    [onChange]
  )

  return (
    <InputPanel id={id}>
      <ContainerRow error={isError}>
        <InputContainer>
          <AutoColumn gap="md">
            <LabelRow>
              <RowBetween>
                <ThemedText.DeprecatedBlack color={theme.neutral2} fontWeight={535} fontSize={14}>
                  {label ?? <Trans>Input</Trans>}
                  {showInfo && infoTooltip && (
                    <MouseoverTooltip text={infoTooltip} placement="top">
                      <Info
                        size={15}
                        // color="#6C5DD3"
                        style={{
                          marginLeft: '4px',
                          marginBottom: '4px',
                          verticalAlign: 'middle',
                          cursor: 'pointer',
                        }}
                      />
                    </MouseoverTooltip>
                  )}
                </ThemedText.DeprecatedBlack>
              </RowBetween>
            </LabelRow>
            <InputRow hasPostfix={!!postfix}>
              <StyledInput
                className={className}
                type="number"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                placeholder={placeholder ?? '0.0'}
                error={isError}
                onChange={handleInput}
                value={value}
              />
              {postfix && <Postfix>{postfix}</Postfix>}
            </InputRow>
          </AutoColumn>
        </InputContainer>
      </ContainerRow>
      {isError && errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
    </InputPanel>
  )
}
