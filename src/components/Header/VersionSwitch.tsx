import { parse } from 'qs'
import React, { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import styled from 'styled-components'

const VersionLabel = styled.span<{ enabled: boolean }>`
  padding: ${({ enabled }) => (enabled ? '0.15rem 0.5rem 0.16rem 0.45rem' : '0.15rem 0.5rem 0.16rem 0.35rem')};
  border-radius: 14px;
  background: ${({ theme, enabled }) => (enabled ? theme.primary1 : 'none')};
  color: ${({ theme, enabled }) => (enabled ? theme.white : theme.primary1)};
  font-size: 0.825rem;
  font-weight: 400;
  :hover {
    user-select: ${({ enabled }) => (enabled ? 'none' : 'initial')};
    background: ${({ theme, enabled }) => (enabled ? theme.primary1 : 'none')};
    color: ${({ theme, enabled }) => (enabled ? theme.white : theme.primary3)};
  }
`
const VersionToggle = styled.div`
  border-radius: 16px;
  background: ${({ theme }) => theme.primary5};
  border: 1px solid ${({ theme }) => theme.primary4};
  color: ${({ theme }) => theme.primary1};
  display: flex;
  width: fit-content;
  cursor: pointer;
  text-decoration: none;
  :hover {
    text-decoration: none;
  }
`

function useParsedQueryString() {
  const { search } = useLocation()
  return useMemo(
    () => (search && search.length > 1 ? parse(search, { parseArrays: false, ignoreQueryPrefix: true }) : {}),
    [search]
  )
}

export function VersionSwitch() {
  const parsed = useParsedQueryString()
  const isV1 = parsed['use'] === 'v1'
  return (
    <VersionToggle>
      <VersionLabel enabled={!isV1}>V2</VersionLabel>
      <VersionLabel enabled={isV1}>V1</VersionLabel>
    </VersionToggle>
  )
}
