import { Trans, t } from '@lingui/macro'
import { darken, lighten, rgba } from 'polished'
import { MouseEventHandler, useCallback, useEffect, useRef, useState } from 'react'
import { Plus, TrendingUp, X } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import { RowBetween } from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'

const RemoveTab = styled.span`
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 14px;
  :hover {
    ${({ theme }) =>
      css`
        background-color: ${theme.darkMode ? lighten(0.3, theme.buttonBlack) : darken(0.2, theme.buttonBlack)};
      `}
  }
  border-radius: 999px;
`

const buttonBackgroundColor = css<{ active?: boolean }>`
  background-color: ${({ theme, active }) => (active ? rgba(theme.primary, 0.3) : theme.buttonBlack)};
  :hover {
    ${({ theme, active }) =>
      !active
        ? css`
            background-color: ${theme.darkMode ? lighten(0.03, theme.buttonBlack) : darken(0.1, theme.buttonBlack)};
          `
        : ''}
  }
  :has(${RemoveTab}:hover) {
    background-color: ${({ theme, active }) => (active ? rgba(theme.primary, 0.3) : theme.buttonBlack)};
  }
`

const borderLeft = css`
  position: relative;
  ::before {
    content: '';
    position: absolute;
    left: 0px;
    top: 4px;
    height: calc(100% - 7px);
    border-left: 1px solid ${({ theme }) => theme.border};
  }
`

const borderRight = css`
  position: relative;
  ::after {
    content: '';
    position: absolute;
    right: 0px;
    top: 4px;
    height: calc(100% - 7px);
    border-right: 1px solid ${({ theme }) => theme.border};
  }
`

const ScrollBtn = styled.button<{ position: 'left' | 'right'; show: boolean }>`
  cursor: pointer;
  border: none;
  ${({ position, theme }) =>
    position === 'left'
      ? css`
          left: 0;
          ${borderRight}
          filter: drop-shadow(20px 0px 5px ${rgba(theme.buttonBlack, 0.6)});
        `
      : css`
          right: 0;
          ${borderLeft}
          ${borderRight}
          filter: drop-shadow(-20px 0px 5px ${rgba(theme.buttonBlack, 0.6)});
        `}
  position: absolute;
  width: 40px;
  height: 100%;
  ${buttonBackgroundColor}
  color: ${({ theme }) => theme.text};
  display: ${({ show }) => (show ? 'initial' : 'none')};
  z-index: 1;
  :focus {
    outline: 0;
  }
`

const AddTabWrapper = styled.div`
  padding: 8px;
  cursor: pointer;
  :hover {
    ${({ theme }) =>
      css`
        ${AddTab} {
          background-color: ${theme.darkMode ? lighten(0.5, theme.subText + '33') : darken(0.1, theme.subText + '33')};
        }
      `}
  }
`

const AddTab = styled.button`
  padding: 4px;
  height: 100%;
  border-radius: 999px;
  border: none;

  ${({ theme }) =>
    css`
      background-color: ${theme.subText}33;
      :hover {
        background-color: ${theme.darkMode ? lighten(0.5, theme.subText + '33') : darken(0.1, theme.subText + '33')};
      }
      color: ${theme.text};
      box-shadow: 0 0 4px ${theme.primary}, 0 0 8px ${theme.primary}, 0 0 12px ${theme.primary},
        0 0 16px ${theme.primary};
    `}

  :focus {
    outline: 0;
  }
  display: flex;
  align-items: center;
  cursor: pointer;

  animation: glow 3000ms infinite;
  animation-direction: alternate;
  animation-timing-function: ease-in;
  animation-delay: 3s;
  @keyframes glow {
    0% {
      box-shadow: none;
    }
    100% {
      ${({ theme }) => css`
        box-shadow: 0 0 4px ${theme.primary}, 0 0 8px ${theme.primary}, 0 0 12px ${theme.primary},
          0 0 16px ${theme.primary};
      `}
    }
  }
`

const ChartButton = styled.button<{ active: boolean }>`
  padding: 8px 12px;
  height: 100%;
  border: none;
  ${buttonBackgroundColor}

  color: ${({ theme }) => theme.text};
  :focus {
    outline: 0;
  }
  display: flex;
  align-items: center;
  cursor: pointer;

  min-width: 120px;
  ${borderLeft}
  ${buttonBackgroundColor}
  ${({ active, theme }) =>
    active
      ? css`
          color: ${theme.primary};
          border-width: 0;
          border-bottom: 2px solid ${({ theme }) => theme.primary};
        `
      : ''}
`

const Container = styled(RowBetween)`
  width: 0;
  min-width: 100%;
  height: 32px;
  background-color: ${({ theme }) => theme.buttonBlack};
  box-sizing: content-box;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  overflow: hidden;
`

const ScrollBar = styled(Flex)`
  position: relative;
  width: 100%;
`

const TabSlide = styled(Flex)`
  flex-direction: row;
  width: 100%;
  overflow-x: scroll;
`

const TabContainer = styled(RowBetween)<{ active: boolean; noBorder?: boolean }>`
  min-width: 120px;
  width: 120px;
  padding: 8px 12px;
  cursor: pointer;
  user-select: none;
  ${buttonBackgroundColor}
  ${({ noBorder, active, theme }) =>
    active
      ? css`
          color: ${theme.primary};
          border-width: 0;
          border-bottom: 2px solid ${({ theme }) => theme.primary};
          padding: 8px 12px 6px;
        `
      : noBorder
      ? ''
      : borderRight}
`

const Tab = ({
  onSelected,
  active,
  index,
  onRemove,
  noBorder,
  tabsCount,
}: {
  onSelected: () => void
  active: boolean
  index: number
  onRemove: () => void
  noBorder: boolean
  tabsCount: number
}) => {
  const onClickRemove: MouseEventHandler<HTMLSpanElement> = useCallback(
    event => {
      event.stopPropagation()
      onRemove()
    },
    [onRemove],
  )

  return (
    <TabContainer active={active} onClick={onSelected} noBorder={noBorder}>
      <Text fontSize={14}>
        <Trans>Position {index + 1}</Trans>
      </Text>
      {tabsCount > 1 && (
        <RemoveTab onClick={onClickRemove}>
          <X size={12} />
        </RemoveTab>
      )}
    </TabContainer>
  )
}

const Tabs = ({
  tabsCount,
  selectedTab,
  onChangedTab,
  onAddTab,
  onRemoveTab,
  showChart,
  onToggleChart,
}: {
  tabsCount: number
  selectedTab: number
  onChangedTab: (index: number) => void
  onAddTab: () => void
  onRemoveTab: (index: number) => void
  showChart: boolean
  onToggleChart: (newValue?: boolean) => void
}) => {
  const [showScrollLeft, setShowScrollLeft] = useState(false)
  const [showScrollRight, setShowScrollRight] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const scrollLeft = useCallback(() => {
    ref.current?.scrollBy({ left: -150, behavior: 'smooth' })
  }, [])

  const scrollRight = useCallback(() => {
    ref.current?.scrollBy({ left: 150, behavior: 'smooth' })
  }, [])

  const onScroll = useCallback(() => {
    const a: any = ref.current ?? {}
    setShowScrollLeft(a.scrollLeft !== 0)
    setShowScrollRight(a.scrollLeft + a.clientWidth !== a.scrollWidth)
  }, [])

  useEffect(() => {
    onScroll()
  }, [tabsCount, onScroll])

  const tabsCountBeforeRef = useRef(tabsCount)
  useEffect(() => {
    if (tabsCount > tabsCountBeforeRef.current) {
      scrollRight()
      onChangedTab(tabsCount - 1)
    }
    tabsCountBeforeRef.current = tabsCount
  }, [scrollRight, tabsCount, onChangedTab])

  return (
    <Container gap="0">
      <ScrollBar>
        <ScrollBtn onClick={scrollLeft} position="left" show={showScrollLeft}>
          &lt;
        </ScrollBtn>
        <TabSlide ref={ref} onScroll={onScroll}>
          {new Array(tabsCount).fill(0).map((_, index) => {
            return (
              <Tab
                key={index}
                active={!showChart && selectedTab === index}
                index={index}
                onSelected={() => {
                  onChangedTab(index)
                  onToggleChart(false)
                }}
                onRemove={() => {
                  if (tabsCount > 1) {
                    if (selectedTab >= tabsCount - 1) {
                      onChangedTab(tabsCount - 2)
                    }
                    onRemoveTab(index)
                  }
                }}
                noBorder={!showChart && selectedTab === index + 1}
                tabsCount={tabsCount}
              />
            )
          })}
          <AddTabWrapper onClick={() => onAddTab()}>
            <MouseoverTooltip text={t`Add a new position`} width="fit-content" placement="top">
              <AddTab>
                <Plus size={12} />
              </AddTab>
            </MouseoverTooltip>
          </AddTabWrapper>
        </TabSlide>

        <ScrollBtn onClick={scrollRight} position="right" show={showScrollRight}>
          &gt;
        </ScrollBtn>
      </ScrollBar>
      <ChartButton onClick={() => onToggleChart()} active={showChart}>
        <TrendingUp size={14} />
        &nbsp;Price chart
      </ChartButton>
    </Container>
  )
}

export default Tabs
