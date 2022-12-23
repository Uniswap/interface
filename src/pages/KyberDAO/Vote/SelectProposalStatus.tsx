import { Trans } from '@lingui/macro'
import { lighten } from 'polished'
import { useRef, useState } from 'react'
import { ChevronDown } from 'react-feather'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ProposalStatus } from 'hooks/kyberdao/types'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'

const Wrapper = styled.div`
  position: relative;
`
const Select = styled.div`
  cursor: pointer;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 500;
  padding: 8px 12px;
  width: min(140px, 30vw);
  height: 36px;
  z-index: 101;
  position: inherit;
  ${({ theme }) => css`
    background-color: ${theme.background};
    color: ${theme.border};
    :hover {
      background-color: ${lighten(0.1, theme.background)};
    }
  `}
`
const DropdownList = styled.div<{ show: boolean }>`
  border-radius: 8px;
  transition: 0.2s all ease;
  position: absolute;
  left: 0;
  display: flex;
  flex-direction: column;
  padding: 8px;
  width: 140px;
  z-index: 100;
  overflow: hidden;
  font-size: 14px;
  font-weight: 500;
  ${({ theme, show }) => css`
    background-color: ${theme.tableHeader};
    color: ${theme.subText};
    ${show
      ? css`
          opacity: 1;
          max-height: 500px;
          top: calc(100% + 4px);
        `
      : css`
          opacity: 0;
          top: 0;
          max-height: 0;
        `};
  `}
`
const DropdownItem = styled.div<{ active?: boolean }>`
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  ${({ theme, active }) => css`
    :hover {
      background-color: ${theme.buttonGray};
    }
    ${active && `color: ${theme.primary}`}
  `}
`

export default function SelectProposalStatus({
  status,
  setStatus,
}: {
  status?: string
  setStatus?: (s: string) => void
}) {
  const theme = useTheme()
  const [show, setShow] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useOnClickOutside(ref, () => setShow(false))
  return (
    <>
      <Wrapper ref={ref}>
        <Select onClick={() => setShow(s => !s)}>
          <Text color={!!status && status !== 'All' ? theme.text : undefined}>{status || 'All'}</Text>
          <ChevronDown size={16} />
        </Select>
        <DropdownList show={show}>
          <DropdownItem
            key="All"
            active={!status}
            onClick={() => {
              setShow(false)
              setStatus?.('')
            }}
          >
            <Trans>All</Trans>
          </DropdownItem>
          {Object.values(ProposalStatus).map(s => {
            return (
              <DropdownItem
                key={s}
                active={s === status}
                onClick={() => {
                  setShow(false)
                  setStatus?.(s)
                }}
              >
                {s}
              </DropdownItem>
            )
          })}
        </DropdownList>
      </Wrapper>
    </>
  )
}
