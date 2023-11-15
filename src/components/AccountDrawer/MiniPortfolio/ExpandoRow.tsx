import { MessageDescriptor } from '@lingui/core'
import { msg } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import Column from 'components/Column'
import Row from 'components/Row'
import { PropsWithChildren } from 'react'
import { ChevronDown } from 'react-feather'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'

const ExpandIcon = styled(ChevronDown)<{ $expanded: boolean }>`
  color: ${({ theme }) => theme.neutral2};
  transform: ${({ $expanded }) => ($expanded ? 'rotate(180deg)' : 'rotate(0deg)')};
  transition: transform ${({ theme }) => theme.transition.duration.medium};
`

const ToggleButton = styled(Row)`
  background-color: ${({ theme }) => theme.surface3};
  border-radius: 12px;
  padding: 4px 8px 4px 12px;
  height: 100%;
  width: fit-content;
  cursor: pointer;
  :hover {
    opacity: 0.8;
  }
`

const Wrapper = styled(Column)<{ numItems: number; isExpanded: boolean }>`
  height: ${({ numItems, isExpanded }) => (isExpanded ? numItems * 68 + 'px' : 0)};
  transition: ${({ theme }) => `height ${theme.transition.duration.medium} ease-in-out`};
  overflow: hidden;
`

// TODO(WEB-1982): Replace this component to use `components/Expand` under the hood
type ExpandoRowProps = PropsWithChildren<{
  title?: MessageDescriptor
  numItems: number
  isExpanded: boolean
  toggle: () => void
}>
export function ExpandoRow({ title = msg`Hidden`, numItems, isExpanded, toggle, children }: ExpandoRowProps) {
  const { _ } = useLingui()

  if (numItems === 0) return null
  return (
    <>
      <Row align="center" justify="space-between" padding="16px">
        <ThemedText.SubHeader color="neutral2" variant="subheadSmall">
          {`${_(title)} (${numItems})`}
        </ThemedText.SubHeader>
        <ToggleButton align="center" onClick={toggle}>
          <ThemedText.LabelSmall color="neutral2" variant="buttonLabelSmall">
            {_(isExpanded ? msg`Hide` : msg`Show`)}
          </ThemedText.LabelSmall>
          <ExpandIcon $expanded={isExpanded} />
        </ToggleButton>
      </Row>
      <Wrapper numItems={numItems} isExpanded={isExpanded}>
        {children}
      </Wrapper>
    </>
  )
}
