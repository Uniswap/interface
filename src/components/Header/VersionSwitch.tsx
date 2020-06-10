import { stringify } from 'qs'
import React, { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import styled from 'styled-components'
import useParsedQueryString from '../../hooks/useParsedQueryString'
import useToggledVersion, { Version } from '../../hooks/useToggledVersion'

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
const VersionToggle = styled(Link)`
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

export function VersionSwitch() {
  const version = useToggledVersion()
  const location = useLocation()
  const query = useParsedQueryString()
  const toggleDest = useMemo(() => {
    return {
      ...location,
      search: `?${stringify({ ...query, use: version === Version.v1 ? undefined : Version.v1 })}`
    }
  }, [location, query, version])

  return (
    <VersionToggle to={toggleDest}>
      <VersionLabel enabled={version === Version.v2}>V2</VersionLabel>
      <VersionLabel enabled={version === Version.v1}>V1</VersionLabel>
    </VersionToggle>
  )
}
