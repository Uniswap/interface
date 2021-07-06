import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { ExternalLink } from '../../theme'

const Link = styled(ExternalLink)`
  display: inline-block;
  background-color: black;
  width: 100%;
  padding: 0.5rem;
  text-align: center;
  color: white;
  font-size: 1.25rem;
  text-decoration: none !important;
`

interface BannerProps {
  link: string
  items: Array<string>
}

export default function Banner({ items, link }: BannerProps) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const intervalId = setInterval(() => {
      setIndex(prevIndex => (prevIndex + 1) % items.length)
    }, 5000)

    return () => clearInterval(intervalId)
  }, [items])

  return <Link href={link}>{items[index]}</Link>
}
