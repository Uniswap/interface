import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { memo, useLayoutEffect, useMemo, useRef, useState } from 'react'
import styled, { css } from 'styled-components'

import Row from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import { isSupportKyberDao } from 'hooks/kyberdao'
import { TRANSACTION_GROUP } from 'state/transactions/type'

const ListTab = styled.div`
  display: flex;
  width: 100%;
  gap: 2px;
  align-items: center;
  justify-content: space-between;
  padding: 3px;
  overflow-x: auto;
`

type WrapperProps = {
  $scrollable: boolean
  $scrollLeft: boolean
  $scrollRight: boolean
}
const TabWrapper = styled(Row).attrs<WrapperProps>(props => ({
  'data-scrollable': props.$scrollable,
  'data-scroll-left': props.$scrollLeft,
  'data-scroll-right': props.$scrollRight,
}))<WrapperProps>`
  position: relative;

  width: 100%;
  background-color: ${({ theme }) => theme.background};
  border-radius: 20px;
  justify-content: center;

  overflow: hidden;

  &[data-scrollable='true'] {
    justify-content: flex-start;

    ${ListTab} {
      justify-content: flex-start;
    }

    &[data-scroll-left='true'] {
      ::before {
        content: '';
        width: 36px;
        height: 100%;

        position: absolute;
        top: 0;
        left: 0;
        transform: translateX(-1px);

        display: flex;
        align-items: center;

        background: linear-gradient(
          -90deg,
          rgba(0, 0, 0, 0) 0%,
          ${({ theme }) => theme.background} 90%,
          ${({ theme }) => theme.background} 100%
        );
      }
    }

    &[data-scroll-right='true'] {
      ::after {
        content: '';
        width: 36px;
        height: 100%;

        position: absolute;
        top: 0;
        right: 0;
        transform: translateX(1px);

        display: flex;
        justify-content: flex-end;
        align-items: center;

        background: linear-gradient(
          90deg,
          rgba(0, 0, 0, 0) 0%,
          ${({ theme }) => theme.background} 90%,
          ${({ theme }) => theme.background} 100%
        );
      }
    }
  }
`

const tabActiveCSS = css`
  border-radius: 20px;
  color: ${({ theme }) => theme.text};
  background-color: ${({ theme }) => (theme.darkMode ? theme.tabActive : theme.buttonGray)};
`

const TabItem = styled.div<{ active: boolean }>`
  padding: 6px;
  font-weight: 500;
  font-size: 12px;
  line-height: 14px;
  text-align: center;
  cursor: pointer;
  user-select: none;
  color: ${({ theme }) => theme.subText};
  :hover {
    ${tabActiveCSS}
  }
  ${({ active }) => (active ? tabActiveCSS : '')}
`
const listTab = [
  { text: t`All`, value: '' },
  { text: t`Swaps`, value: TRANSACTION_GROUP.SWAP },
  { text: t`Liquidity`, value: TRANSACTION_GROUP.LIQUIDITY },
  { text: t`KyberDAO`, value: TRANSACTION_GROUP.KYBERDAO },
  { text: t`Others`, value: TRANSACTION_GROUP.OTHER },
] as const

type Props = {
  activeTab: string
  setActiveTab: React.Dispatch<React.SetStateAction<string>>
}
const Tab: React.FC<Props> = ({ activeTab, setActiveTab }) => {
  const [isScrollable, setScrollable] = useState(false)
  const [scrollLeft, setScrollLeft] = useState(false)
  const [scrollRight, setScrollRight] = useState(false)

  const { chainId } = useActiveWeb3React()

  const listRef = useRef<HTMLDivElement>(null)

  const handleScroll = () => {
    const node = listRef.current
    if (!node) {
      return
    }

    const { clientWidth, scrollWidth, scrollLeft } = node
    setScrollable(clientWidth < scrollWidth)
    setScrollLeft(scrollLeft > 0)
    setScrollRight(scrollLeft < scrollWidth - clientWidth)
  }

  useLayoutEffect(() => {
    const { ResizeObserver } = window
    const node = listRef.current
    if (!node) {
      return
    }

    const resizeHandler = () => {
      const { clientWidth, scrollWidth, scrollLeft } = node
      setScrollable(clientWidth < scrollWidth)
      setScrollLeft(scrollLeft > 0)
      setScrollRight(scrollLeft < scrollWidth - clientWidth)
    }

    if (typeof ResizeObserver === 'function') {
      const resizeObserver = new ResizeObserver(resizeHandler)
      resizeObserver.observe(node)

      return () => resizeObserver.disconnect()
    } else {
      window.addEventListener('resize', resizeHandler)
      return () => window.removeEventListener('resize', resizeHandler)
    }
  }, [])

  const filterTab = useMemo(() => {
    return listTab.filter(tab => {
      if (tab.value === TRANSACTION_GROUP.KYBERDAO) {
        return isSupportKyberDao(chainId)
      }
      if (tab.value === TRANSACTION_GROUP.LIQUIDITY) {
        return chainId !== ChainId.SOLANA
      }
      return true
    })
  }, [chainId])

  return (
    <TabWrapper $scrollable={isScrollable} $scrollLeft={scrollLeft} $scrollRight={scrollRight}>
      <ListTab ref={listRef} onScroll={handleScroll}>
        {filterTab.map(tab => (
          <TabItem
            style={{ width: `${100 / filterTab.length}%` }}
            key={tab.text}
            active={activeTab === tab.value}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.text}
          </TabItem>
        ))}
      </ListTab>
    </TabWrapper>
  )
}

export default memo(Tab)
