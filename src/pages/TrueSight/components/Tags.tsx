import React, { CSSProperties, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { Flex, Text } from 'rebass'
import { rgba } from 'polished'
import ScrollContainer from 'react-indiana-drag-scroll'
import { useMedia } from 'react-use'
import useThrottle from 'hooks/useThrottle'
import { ScrollContainerWithGradient } from 'components/RewardTokenPrices'
import useTheme from 'hooks/useTheme'
import { TrueSightFilter } from 'pages/TrueSight/index'

const Tags = ({
  tags,
  setFilter,
  style,
  backgroundColor,
}: {
  tags: string[] | null
  setFilter: React.Dispatch<React.SetStateAction<TrueSightFilter>>
  style?: CSSProperties
  backgroundColor?: string
}) => {
  const scrollRef = useRef(null)
  const contentRef: any = useRef(null)
  const shadowRef: any = useRef(null)

  const handleShadow = useThrottle(() => {
    const element: any = scrollRef.current
    if (element?.scrollLeft > 0) {
      shadowRef.current?.classList.add('left-visible')
    } else {
      shadowRef.current?.classList.remove('left-visible')
    }

    if (contentRef.current?.scrollWidth - element?.scrollLeft > element?.clientWidth) {
      shadowRef.current?.classList.add('right-visible')
    } else {
      shadowRef.current?.classList.remove('right-visible')
    }
  }, 300)

  useEffect(() => {
    window.addEventListener('resize', handleShadow)
    return () => window.removeEventListener('resize', handleShadow)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    handleShadow()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tags])

  const above1200 = useMedia('(min-width: 1200px)')
  const theme = useTheme()

  if (above1200) {
    return (
      <ScrollContainerWithGradient
        ref={shadowRef}
        style={{ flex: 1, overflow: 'hidden', justifyContent: 'flex-start' }}
        backgroundColor={backgroundColor ?? theme.background}
      >
        <ScrollContainer innerRef={scrollRef} vertical={false} className="scroll-container" onScroll={handleShadow}>
          <TagContainer style={style} ref={contentRef}>
            {(tags ?? []).map(tag => (
              <Tag
                key={tag}
                onClick={() => setFilter(prev => ({ ...prev, selectedTag: tag, selectedTokenData: undefined }))}
              >
                {tag}
              </Tag>
            ))}
          </TagContainer>
        </ScrollContainer>
      </ScrollContainerWithGradient>
    )
  }

  return (
    <TagContainer style={style}>
      {(tags ?? []).map(tag => (
        <Tag key={tag} onClick={() => setFilter(prev => ({ ...prev, selectedTag: tag, selectedTokenData: undefined }))}>
          {tag}
        </Tag>
      ))}
    </TagContainer>
  )
}

export default Tags

const Tag = styled(Text)`
  font-size: 10px;
  color: ${({ theme }) => theme.subText};
  padding: 5px 8px;
  border-radius: 24px;
  background: ${({ theme }) => rgba(theme.subText, 0.2)};
  cursor: pointer;
  min-width: max-content !important;

  &:hover {
    background: ${({ theme }) => rgba(theme.subText, 0.1)};
  }
`

const TagContainer = styled(Flex)`
  align-items: center;
  gap: 4px;
  flex: 1;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    overflow: unset;
    flex-wrap: wrap;
  `}
`
