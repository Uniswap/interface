import { AutoColumn } from 'components/Column'
import { LoaderV2 } from 'components/Icons/LoadingSpinner'
import React from 'react'
import styled from 'styled-components'

const TopSection = styled(AutoColumn)({
  maxWidth: '480px',
  width: '100%',
})

export const StakePage: React.FC = () => {
  return (
    <>
      <TopSection gap="lg" justify="center">
        <LoaderV2></LoaderV2>
      </TopSection>
    </>
  )
}

export default StakePage
