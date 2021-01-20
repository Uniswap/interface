import React, { useContext, useEffect, useState } from 'react'
import styled from 'styled-components'
import { ThemeContext } from 'styled-components'
import SkeletonLoading from '../../components/SkeletonLoading'

const Temp = styled.div`
  border-radius: 8px;
  text-align: center;
  margin-top: 0.25rem;
  padding: 0.2rem;
`

export default function DemoComponentForLoading() {
  const [isLoading, setIsLoading] = useState(true)

  const theme = useContext(ThemeContext)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 4000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <SkeletonLoading isLoading={isLoading} backgroundColor={theme.bg1} foregroundColor={theme.green1}>
      <Temp>Demo for Showing Skeleton Loading</Temp>
    </SkeletonLoading>
  )
}
