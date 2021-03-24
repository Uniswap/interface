import React from 'react'
import styled from 'styled-components'

import GlobeIcon from 'components/Icons/GlobeIcon'

const StyledLanguageSelector = styled.div`
  display: flex;
  align-items: center;
  margin-left: 8px;
  padding: 6px 9px 6px 10px;
  border-radius: 5px;
  background-color: ${({ theme }) => theme.bg13};
`

const StyledGlobeIcon = styled.div`
  display: flex;
  align-items: center;
  padding-right: 6px;
  border-right: ${({ theme }) => `solid 0.6px ${theme.border}`};
`

const StyledCurrentLanguage = styled.div`
  display: flex;
  align-items: center;
  padding-left: 6px;
  font-size: 14px;
  color: ${({ theme }) => theme.text9};
`

export default function LanguageSelector() {
  return (
    <StyledLanguageSelector>
      <StyledGlobeIcon>
        <GlobeIcon />
      </StyledGlobeIcon>
      {/* TODO: Update this component when we have other languages */}
      <StyledCurrentLanguage>EN</StyledCurrentLanguage>
    </StyledLanguageSelector>
  )
}
