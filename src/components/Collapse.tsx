import React, { CSSProperties, ReactNode, useState } from 'react'
import { ChevronDown } from 'react-feather'
import styled from 'styled-components'

const ItemWrapper = styled.div`
  position: relative;
  padding: 16px 24px;
  width: 100%;
  background: ${({ theme }) => theme.background};
`

const Header = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;

  cursor: pointer;
`

const ArrowWrapper = styled.div`
  width: 32px;
  height: 32px;

  display: flex;
  justify-content: center;
  align-items: center;

  color: ${({ theme }) => theme.text};

  svg {
    transition: all 150ms ease-in-out;
  }

  &[data-expanded='true'] {
    svg {
      transform: rotate(180deg);
    }
  }
`

const ContentWrapper = styled.div`
  width: 100%;

  &[data-expanded='false'] {
    display: none;
  }
`

type Props = {
  header: string | JSX.Element
  expandedOnMount?: boolean
  style?: CSSProperties
  activeStyle?: CSSProperties
  children: ReactNode
  onExpand?: () => void
  className?: string
  arrowComponent?: ReactNode
}

export const CollapseItem: React.FC<Props> = ({
  header,
  arrowComponent,
  children,
  expandedOnMount = false,
  style = {},
  className,
}) => {
  const [isExpanded, setExpanded] = useState(expandedOnMount)

  return (
    <ItemWrapper style={style} className={className}>
      <Header
        onClick={() => {
          setExpanded(e => !e)
        }}
      >
        {header}
        <ArrowWrapper data-expanded={isExpanded}>{arrowComponent || <ChevronDown />}</ArrowWrapper>
      </Header>
      <ContentWrapper data-expanded={isExpanded}>{children}</ContentWrapper>
    </ItemWrapper>
  )
}

export type ToggleItemType = { title: React.ReactNode; content: ReactNode | string }
// open one, close the others
const ToggleCollapse = ({
  data,
  itemActiveStyle = {},
  itemStyle = {},
}: {
  data: ToggleItemType[]
  itemActiveStyle?: CSSProperties
  itemStyle?: CSSProperties
}) => {
  const [expandedIndex, setExpandedIndex] = useState(0)
  return (
    <div>
      {data.map((item, index) => {
        const isActive = expandedIndex === index
        return (
          <ItemWrapper key={index} style={isActive ? { ...itemStyle, ...itemActiveStyle } : itemStyle}>
            <Header
              onClick={() => {
                setExpandedIndex(isActive ? -1 : index)
              }}
            >
              {item.title}
              <ArrowWrapper data-expanded={isActive}>
                <ChevronDown />
              </ArrowWrapper>
            </Header>
            <ContentWrapper data-expanded={isActive}>{item.content}</ContentWrapper>
          </ItemWrapper>
        )
      })}
    </div>
  )
}

export default ToggleCollapse
