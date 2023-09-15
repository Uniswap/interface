import { easeQuadInOut } from 'd3'
import usePrevious from 'hooks/usePrevious'
import ms from 'ms'
import React, { useEffect, useState } from 'react'
import { animated, useSpring } from 'react-spring'
// Import this accordingly
import styled, { useTheme } from 'styled-components'

const NUMBER_ARRAY = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
const NUMBER_WIDTH_ARRAY = [20.2, 14.5, 20.2, 20.2, 20.2, 20.2, 20.2, 20.2, 20.2, 20.2]
const DIGIT_HEIGHT = 44
const ADDITIONAL_WIDTH_FOR_ANIMATIONS = 10

const RollNumber = ({
  digit,
  nextColor,
  index,
  commonPrefixLength,
}: {
  chars: string[]
  digit?: string
  nextColor?: string
  index: number
  commonPrefixLength: number
}): JSX.Element => {
  const theme = useTheme()

  const [{ yOffset, width, fontColor }, setAnimatedProps] = useSpring(() => ({
    yOffset: 0,
    width: (NUMBER_WIDTH_ARRAY[Number(digit)] || 0) + ADDITIONAL_WIDTH_FOR_ANIMATIONS,
    fontColor: nextColor || theme.neutral1,
  }))

  useEffect(() => {
    const finishColor = theme.neutral1
    if (nextColor && index > commonPrefixLength - 1) {
      setAnimatedProps({
        fontColor: nextColor,
        config: { duration: ms('0.25s') },
        onRest: () => {
          setTimeout(() => {
            setAnimatedProps({
              fontColor: finishColor,
              config: { duration: ms('0.3s') },
            })
          }, ms('50ms'))
        },
      })
    } else {
      setAnimatedProps({ fontColor: finishColor })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digit, nextColor, theme.neutral3, theme.neutral1])

  const numbers = NUMBER_ARRAY.map((char, index) => {
    return (
      <animated.span key={char + index} style={{ height: DIGIT_HEIGHT, color: fontColor }}>
        {char}
      </animated.span>
    )
  })

  useEffect(() => {
    const delay = ms('0.1s') + (index - commonPrefixLength) * ms('50ms')
    if (digit && Number(digit) >= 0) {
      setAnimatedProps({
        yOffset: DIGIT_HEIGHT * -digit,
        width: (NUMBER_WIDTH_ARRAY[Number(digit)] || 0) + ADDITIONAL_WIDTH_FOR_ANIMATIONS,
        config: { easing: easeQuadInOut, duration: ms('0.1s') },
        delay,
      })
    }
  }, [commonPrefixLength, digit, index, setAnimatedProps])

  if (digit && Number(digit) >= 0) {
    return (
      <animated.div
        style={{
          transform: yOffset.to((y) => `translateY(${y}px)`),
          overflow: 'hidden',
          width,
          marginRight: -ADDITIONAL_WIDTH_FOR_ANIMATIONS,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {numbers}
      </animated.div>
    )
  } else {
    return <animated.span style={{ color: fontColor, height: DIGIT_HEIGHT }}>{digit}</animated.span>
  }
}

const Char = ({
  index,
  chars,
  nextColor,
  commonPrefixLength,
}: {
  index: number
  chars: string[]
  nextColor?: string
  commonPrefixLength: number
}): JSX.Element => {
  return (
    <div style={{ height: DIGIT_HEIGHT, overflow: 'hidden' }}>
      <RollNumber
        chars={chars}
        commonPrefixLength={commonPrefixLength}
        digit={chars[index]}
        index={index}
        nextColor={nextColor}
      />
    </div>
  )
}

function longestCommonPrefix(a: string, b: string): string {
  let i = 0
  while (a[i] && b[i] && a[i] === b[i]) {
    i++
  }
  return a.substr(0, i)
}

const Wrapper = styled.div`
  display: flex;
  align-items: flex-start;
  flex-direction: row;

  mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);
`

const AnimatedNumber = ({
  value,
  num,
  colorIndicationDuration,
}: {
  value?: string
  num: number
  colorIndicationDuration: number
}) => {
  const prevNum = usePrevious(num)
  const prevValue = usePrevious(value)
  const [chars, setChars] = useState<string[]>()
  const [commonPrefixLength, setCommonPrefixLength] = useState(0)
  const [nextColor, setNextColor] = useState<string>()

  const theme = useTheme()

  useEffect(() => {
    if (value && num && prevNum !== num) {
      if (prevNum && num > prevNum) {
        setNextColor(theme.success)
      } else if (prevNum && num < prevNum) {
        setNextColor(theme.critical)
      } else {
        setNextColor(undefined)
      }
      const newChars = value.split('')
      setChars(newChars)
      setCommonPrefixLength(longestCommonPrefix(prevValue ?? '', value).length)
      setTimeout(() => {
        setNextColor(undefined)
      }, colorIndicationDuration)
    }
  }, [colorIndicationDuration, prevValue, theme.neutral2, theme.critical, theme.success, value, num, prevNum])

  return (
    <Wrapper>
      {chars?.map((_, index) => (
        <Char
          key={index === 0 ? `$_sign_${theme.neutral1}` : `$_number_${index}`}
          chars={chars}
          commonPrefixLength={commonPrefixLength}
          index={index}
          nextColor={nextColor}
        />
      ))}
    </Wrapper>
  )
}

export default AnimatedNumber
