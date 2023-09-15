import { easeQuadInOut } from 'd3'
import usePrevious from 'hooks/usePrevious'
import ms from 'ms'
import React, { useEffect, useState } from 'react'
import { animated, useSpring } from 'react-spring'
// Import this accordingly
import styled, { useTheme } from 'styled-components'

// textWidthUtil.ts
const FONT = 'Basel'
const FONT_SIZE = '36px'
const FONT_LETTER_SPACING = 0.3

export function measureTextWidth(text: string): number {
  // Create a span element
  const span = document.createElement('span')

  // Set its styles
  span.style.font = FONT
  span.style.fontSize = FONT_SIZE
  span.style.position = 'absolute'
  span.style.left = '-9999px' // To ensure it doesn't appear on screen

  // Set its content
  span.textContent = text
  console.log('cartcrom', { text, letterSpacing: span.style.letterSpacing })

  // Append it to the body
  document.body.appendChild(span)

  // Measure its width
  const width = span.offsetWidth

  // Remove the span from the body
  document.body.removeChild(span)

  return width + FONT_LETTER_SPACING
}

export function measureLetterSpacing(): number {
  const widthSingle = measureTextWidth('0')
  const widthDouble = measureTextWidth('00')

  console.log('cartcrom', widthSingle, widthDouble)

  return measureTextWidth('66') - measureTextWidth('6') * 2
}
console.log('cartcrom', measureLetterSpacing())
const COMMON_LETTER_SPACING = measureTextWidth('5')

const NUMBER_WIDTH_ARRAY = [
  COMMON_LETTER_SPACING,
  measureTextWidth('1'),
  measureTextWidth('2'),
  COMMON_LETTER_SPACING,
  COMMON_LETTER_SPACING,
  COMMON_LETTER_SPACING,
  COMMON_LETTER_SPACING,
  COMMON_LETTER_SPACING,
  COMMON_LETTER_SPACING,
  COMMON_LETTER_SPACING,
]
console.log('cartcrom', NUMBER_WIDTH_ARRAY)

const NUMBER_ARRAY = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
// const NUMBER_WIDTH_ARRAY = [19.3, 14.4, 19.3, 19.3, 19.3, 19.3, 19.3, 19.3, 19.3, 19.3]
const DIGIT_HEIGHT = 36
const ADDITIONAL_WIDTH_FOR_ANIMATIONS = 0

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
    yOffset: DIGIT_HEIGHT * -(digit ?? 0),
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
      <animated.span
        key={char + index}
        style={{
          height: DIGIT_HEIGHT,
          color: fontColor,
          display: 'flex',
          alignItems: 'center',
          lineHeight: DIGIT_HEIGHT,
        }}
      >
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
          display: 'flex',
          flexDirection: 'column',
          userSelect: 'none',
        }}
      >
        {numbers}
      </animated.div>
    )
  } else {
    return (
      <animated.span
        style={{
          color: fontColor,
          height: DIGIT_HEIGHT,
          display: 'flex',
          alignItems: 'center',
          lineHeight: 44,
          userSelect: 'none',
        }}
      >
        {digit}
      </animated.span>
    )
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

const Wrapper = styled.div<{ hideText?: boolean }>`
  position: absolute;
  display: flex;
  align-items: flex-start;
  flex-direction: row;
  /* height: 44px; */
  line-height: 44px;

  font-size: 36px;
  font-weight: 485;

  mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);

  ${({ hideText }) => hideText && 'opacity: 0'};
`

const AnimatedNumber = ({
  value,
  num,
  colorIndicationDuration,
  hideText,
}: {
  value?: string
  num: number
  colorIndicationDuration: number
  hideText?: boolean
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
    <Wrapper hideText={hideText}>
      {chars?.map((_, index) => (
        <Char
          key={index === 0 ? `$_sign_${theme.neutral1}` : `$_number_${index}`}
          chars={chars}
          commonPrefixLength={commonPrefixLength}
          index={index}
          // nextColor={nextColor}
        />
      ))}
    </Wrapper>
  )
}

export default AnimatedNumber
