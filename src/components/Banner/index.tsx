import React, { useEffect, useState } from 'react'
import styled from 'styled-components'

const Wrapper = styled.div`
  background-color: black;
  width: 100%;
  padding: 0.5rem;
  text-align: center;
  color: white;
  font-size: 1.25rem;
`

interface BannerProps {
  items: Array<string>
}

export default function Banner({ items }: BannerProps) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const intervalId = setInterval(() => {
      setIndex(prevIndex => (prevIndex + 1) % items.length)
    }, 5000)

    return () => clearInterval(intervalId)
  }, [items])

  return <Wrapper>{items[index]}</Wrapper>
}
