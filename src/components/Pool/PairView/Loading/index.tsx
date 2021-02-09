import React, { useContext } from 'react'
import ContentLoader from 'react-content-loader'
import { ThemeContext } from 'styled-components'

export default function Loading() {
  const theme = useContext(ThemeContext)

  return (
    <ContentLoader backgroundColor={theme.bg3} foregroundColor={theme.bg2} viewBox="0 0 500px 500px" height="100%">
      {/* header */}
      <circle r="13px" cx="13px" cy="13px" />
      <circle r="13px" cx="26px" cy="13px" />
      <rect x="48" y="6" rx="2" ry="2" width="60" height="16" />

      {/* first data row */}
      <rect x="0" y="44" rx="2" ry="2" width="60" height="14" />
      <rect x="100%" y="44" rx="2" ry="2" width="60" height="14" style={{ transform: 'translateX(-60px)' }} />

      {/* second data row */}
      <rect x="0" y="71" rx="2" ry="2" width="60" height="14" />
      <rect x="100%" y="71" rx="2" ry="2" width="60" height="14" style={{ transform: 'translateX(-60px)' }} />

      {/* third data row */}
      <rect x="0" y="1312" rx="2" ry="2" width="60" height="14" />
      <rect x="100%" y="106" rx="8" ry="8" width="80" height="27" style={{ transform: 'translateX(-80px)' }} />
      <rect x="100%" y="106" rx="8" ry="8" width="40" height="27" style={{ transform: 'translateX(-130px)' }} />

      {/* first collapsible */}
      <rect x="0" y="152" rx="8" ry="8" width="100%" height="68" />
      <rect x="0" y="228" rx="8" ry="8" width="100%" height="68" />
    </ContentLoader>
  )
}
