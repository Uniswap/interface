import React, { useContext } from 'react'
import ContentLoader from 'react-content-loader'
import { ThemeContext } from 'styled-components'

export default function Loading() {
  const theme = useContext(ThemeContext)

  return (
    <ContentLoader backgroundColor={theme.bg3} foregroundColor={theme.bg2} viewBox="0 0 500px 500px" height="100%">
      {/* header */}
      <circle r="10px" cx="10px" cy="10px" />
      <circle r="10px" cx="23px" cy="10px" />
      <rect x="44" y="0" rx="2" ry="2" width="60" height="20" />

      {/* first data row */}
      <rect x="0" y="44" rx="2" ry="2" width="60" height="14" />
      <rect x="100%" y="44" rx="2" ry="2" width="60" height="14" style={{ transform: 'translateX(-60px)' }} />

      {/* second data row */}
      <rect x="0" y="71" rx="2" ry="2" width="60" height="14" />
      <rect x="100%" y="71" rx="2" ry="2" width="60" height="14" style={{ transform: 'translateX(-60px)' }} />

      {/* third data row */}
      <rect x="0" y="98" rx="2" ry="2" width="60" height="14" />
      <rect x="100%" y="98" rx="2" ry="2" width="60" height="14" style={{ transform: 'translateX(-60px)' }} />

      {/* first collapsible */}
      <rect x="0" y="140" rx="8" ry="8" width="100%" height="295px" />

      {/* governance button */}
      <rect x="0" y="462" rx="8" ry="8" width="100%" height="37px" />
    </ContentLoader>
  )
}
