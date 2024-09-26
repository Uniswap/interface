import Column from 'components/deprecated/Column'
import Row from 'components/deprecated/Row'
import styled from 'lib/styled-components'
import { PropsWithChildren } from 'react'
import { ChevronDown } from 'react-feather'
import { ThemedText } from 'theme/components'
import { t } from 'uniswap/src/i18n'

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
type ExpandoRowProps = PropsWithChildren<{ title?: string; numItems: number; isExpanded: boolean; toggle: () => void }>
export function ExpandoRow({ title = t('common.hidden'), numItems, isExpanded, toggle, children }: ExpandoRowProps) {
  if (numItems === 0) {
    return null
  }
  return (
    <>
      <Row align="center" justify="space-between" padding="16px">
        <ThemedText.SubHeader color="neutral2" variant="subheadSmall">
          {`${title} (${numItems})`}
        </ThemedText.SubHeader>
        <ToggleButton align="center" onClick={toggle}>
          <ThemedText.LabelSmall color="neutral2" variant="buttonLabelSmall">
            {isExpanded ? t('common.hide.button') : t('common.show.button')}
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
