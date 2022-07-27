import React, { useState } from 'react'
import styled from 'styled-components'
import { ChevronUp } from 'react-feather'

const Wrapper = styled.div`
  position: relative;
  padding: 16px 24px;
  width: 100%;
  background: ${({ theme }) => theme.background};
  border-radius: 20px;
`

const Header = styled.div`
  width: 100%;
  height: 32px;

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

  &[data-expanded='false'] {
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
}

const BlockWrapper: React.FC<Props> = ({ header, children, expandedOnMount = false }) => {
  const [isExpanded, setExpanded] = useState(expandedOnMount)

  return (
    <Wrapper>
      <Header onClick={() => setExpanded(e => !e)}>
        {header}

        <ArrowWrapper data-expanded={isExpanded}>
          <ChevronUp />
        </ArrowWrapper>
      </Header>

      <ContentWrapper data-expanded={isExpanded}>{children}</ContentWrapper>
    </Wrapper>
  )
}

export default BlockWrapper
