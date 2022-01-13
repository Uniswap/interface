import React from 'react'
import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { Text, Flex } from 'rebass'
import useTheme from 'hooks/useTheme'
import { animated, useSpring } from 'react-spring'

export function usePrevious(value: number) {
  const ref = useRef<number>(value)

  useEffect(() => {
    ref.current = value
  })

  return ref.current
}

function formatForDisplay(number = 0) {
  if (number > 1000000)
    return Math.max(number, 0)
      .toString()
      .split('')
      .reverse()
  else {
    return Math.max(number, 0)
      .toPrecision(6)
      .split('')
      .reverse()
  }
}

function DecimalColumn() {
  return <div>.</div>
}

const TicketView = styled.div<{ fontSize: number }>`
  height: 100%;
  display: flex;
  flex-direction: row-reverse;
  overflow: hidden;
  font-size: ${({ fontSize }) => fontSize}px;
  position: relative;
  color: ${({ theme }) => theme.subText};
  letter-spacing: -1px;
  margin-right: 5px;
`

const NumberPlaceHolder = styled.span`
  visibility: hidden;
`

const Container = styled.div<{ fontSize: number }>`
  position: relative;
  height: ${({ fontSize }) => fontSize + 4}px;
`

const TickerDigit = styled.div`
  height: 10%;
  text-align: center;
`

const TickerColumn = styled(animated.div)`
  position: absolute;
  height: 1000%;
  bottom: 0;
  transition: all 0.6s cubic-bezier(0.4, -0.1, 0.6, 1) 1;
`

function NumberColumn({ digit, fontSize }: { digit: number; fontSize: number }) {
  const [position, setPosition] = useState(0)
  const columnContainer = useRef<HTMLDivElement>()

  const setColumnToNumber = (number: number) => {
    if (columnContainer.current) {
      setPosition(columnContainer.current?.clientHeight * number ?? 0)
    }
  }

  useEffect(() => setColumnToNumber(digit), [digit])

  const styles = useSpring({
    to: { transform: `translateY(${position}px)` }
  })

  return (
    <Container ref={columnContainer as any} fontSize={fontSize}>
      <TickerColumn style={styles}>
        {[9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map(num => (
          <TickerDigit key={num}>{num}</TickerDigit>
        ))}
      </TickerColumn>
      <NumberPlaceHolder>0</NumberPlaceHolder>
    </Container>
  )
}

export default function AnimatingNumber({
  value,
  symbol,
  fontSize
}: {
  value: number
  symbol: string | undefined
  fontSize: number
}) {
  const values = value.toString().split('e')
  const baseValue = parseFloat(values[0])
  const eValue = values[1]
  const numArray = formatForDisplay(baseValue)
  const theme = useTheme()

  return (
    <Flex style={{ fontWeight: 500 }}>
      <TicketView fontSize={fontSize}>
        {numArray.map((number, index) =>
          number === '.' ? (
            <DecimalColumn key={index} />
          ) : (
            <NumberColumn key={index} digit={parseInt(number)} fontSize={fontSize} />
          )
        )}
      </TicketView>
      {eValue && (
        <Flex fontSize="16px" alignItems={'flex-end'} color={theme.subText} paddingBottom="3px" paddingTop="5px">
          10<sup style={{ fontSize: '10px', alignSelf: 'flex-start' }}>{eValue}</sup>
        </Flex>
      )}
      {symbol && (
        <Text fontSize={fontSize} color={theme.subText}>
          {symbol}
        </Text>
      )}
    </Flex>
  )
}
