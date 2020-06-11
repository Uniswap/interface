import { stringify } from 'qs'
import React, { useCallback, useMemo } from 'react'
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
const VersionToggle = styled(Link)<{ enabled: boolean }>`
  border-radius: 16px;
  opacity: ${({ enabled }) => (enabled ? 1 : 0.5)};
  cursor: ${({ enabled }) => (enabled ? 'pointer' : 'default')};
  background: ${({ theme }) => theme.primary5};
  border: 1px solid ${({ theme }) => theme.primary4};
  color: ${({ theme }) => theme.primary1};
  display: flex;
  width: fit-content;
  text-decoration: none;
  :hover {
    text-decoration: none;
  }
`

export function VersionSwitch() {
  const version = useToggledVersion()
  const location = useLocation()
  const query = useParsedQueryString()
  const versionSwitchAvailable = location.pathname === '/swap' || location.pathname === '/send'

  const toggleDest = useMemo(() => {
    return versionSwitchAvailable
      ? {
          ...location,
          search: `?${stringify({ ...query, use: version === Version.v1 ? undefined : Version.v1 })}`
        }
      : location
  }, [location, query, version, versionSwitchAvailable])

  const handleClick = useCallback(
    e => {
      if (!versionSwitchAvailable) e.preventDefault()
    },
    [versionSwitchAvailable]
  )

  return (
    <VersionToggle enabled={versionSwitchAvailable} to={toggleDest} onClick={handleClick}>
      <VersionLabel enabled={version === Version.v2 || !versionSwitchAvailable}>V2</VersionLabel>
      <VersionLabel enabled={version === Version.v1 && versionSwitchAvailable}>V1</VersionLabel>
    </VersionToggle>
  )
}
