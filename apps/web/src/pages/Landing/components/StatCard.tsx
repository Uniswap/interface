import Row from 'components/Row'
import { motion } from 'framer-motion'
import { parseToRgb } from 'polished'
import styled, { keyframes, useTheme } from 'styled-components'
import { opacify } from 'theme/utils'

const Mask = motion(styled.div`
  position: relative;
  display: flex;
  flex: 0;
  min-height: 52px;
  width: 100%;
  overflow: hidden;
  @media (max-width: 1024px) {
    min-height: 40px;
  }
  @media (max-width: 768px) {
    min-height: 32px;
  }
`)
const Char = motion(styled.div<{ color: string }>`
  font-variant-numeric: lining-nums tabular-nums;
  font-family: Basel;
  font-size: 52px;
  font-style: normal;
  font-weight: 500;
  color: ${({ color }) => color};
  line-height: 52px;
  @media (max-width: 1280px) {
    font-size: 40px;
    line-height: 40px;
  }
  @media (max-width: 1050px) {
    font-size: 32px;
    line-height: 32px;
  }
  @media (max-width: 850px) {
    font-size: 28px;
    line-height: 28px;
  }
  @media (max-width: 396px) {
    font-size: 22px;
    line-height: 22px;
  }
`)
const Container = styled.div<{ live?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  border-radius: 20px;

  width: 100%;
  height: 100%;
  max-height: 230px;

  padding: 32px;

  background-color: ${({ theme, live }) => (live ? '#2FBA610A' : theme.surface2)};
  overflow: hidden;

  @media (max-width: 1024px) {
    padding: 24px;
  }
  @media (max-width: 768px) {
  }
  background-image: radial-gradient(rgba(${({ theme }) => {
    const { red, green, blue } = parseToRgb(theme.neutral2)
    return `${red}, ${green}, ${blue}`
  }}, 0.25) 0.5px, transparent 0)};
  background-size: 12px 12px;
  background-position: -8.5px -8.5px;
`
const SpriteContainer = motion(styled.div`
  pointer-events: none;
  diplay: flex;
  flex-direction: column;
  color: ${({ theme }) => theme.neutral2};
`)

const pulsate = (color: string) => keyframes`
  0% {
    box-shadow: 0 0 0 0 ${opacify(24, color)};
  }
  100% {
    box-shadow: 0 0 0 4px ${opacify(24, color)};
  }
`
const LiveIcon = styled.div<{ display: string }>`
  display: ${({ display }) => display};
  width: 6px;
  height: 6px;

  border-radius: 50%;
  background: ${({ theme }) => theme.success};

  animation-name: ${({ theme }) => pulsate(theme.success)};
  animation-fill-mode: forwards;
  animation-direction: alternate;
  animation-duration: 1000ms;
  animation-iteration-count: infinite;
  animation-timing-function: ease-in-out;
`
const Title = styled.h3<{ color: string }>`
  padding: 0;
  margin: 0;
  font-family: Basel;
  font-size: 24px;
  font-style: normal;
  font-weight: 535;
  line-height: 32px; /* 133.333% */
  color: ${({ color }) => color};
  @media (max-width: 1024px) {
    font-size: 18px;
    line-height: 26px;
  }
  @media (max-width: 768px) {
    font-size: 18px;
    line-height: 20px;
  }
`
type StatCardProps = {
  title: string
  value: string
  live?: boolean
  prefix?: string
  suffix?: string
  delay?: number
  inView?: boolean
}

function rotateArray<T>(arr: T[], n: number) {
  return arr.slice(n, arr.length).concat(arr.slice(0, n))
}

const numeric = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
const currency = ['¥', '£', '€', '$']
const suffixes = [' ', 'K', 'M', 'B', 'T']
const delineators = [',', '.']

export function StatCard(props: StatCardProps) {
  const theme = useTheme()
  return (
    <Container live={props.live}>
      <Row align="center" gap="sm">
        <LiveIcon display={props.live ? 'block' : 'none'} />
        <Title color={props.live ? theme.success : theme.neutral2}>{props.title}</Title>
      </Row>
      <StringInterpolationWithMotion
        prefix={props.prefix}
        suffix={props.suffix}
        value={props.value}
        live={props.live}
        delay={props.delay}
        inView={props.inView}
      />
    </Container>
  )
}

function StringInterpolationWithMotion({ value, delay, inView, live }: Omit<StatCardProps, 'title'>) {
  const chars = value.split('')
  const theme = useTheme()

  return (
    <Mask
      initial="initial"
      animate={inView ? 'animate' : 'initial'}
      transition={{ staggerChildren: 0.025, delayChildren: delay }}
    >
      {chars.map((char: string, index: number) => {
        // select charset based on char
        const charset = numeric.includes(char)
          ? numeric
          : delineators.includes(char)
          ? delineators
          : currency.includes(char)
          ? currency
          : suffixes

        return <NumberSprite char={char} key={index} charset={charset} color={live ? theme.success : theme.neutral1} />
      })}
    </Mask>
  )
}

function NumberSprite({ char, charset, color }: { char: string; charset: string[]; color: string }) {
  const height = 60

  // rotate array so that the char is at the top
  const chars = rotateArray(charset, charset.indexOf(char))

  const idx = chars.indexOf(char)

  const variants = {
    initial: {
      y: idx + 3 * -height,
    },
    animate: {
      y: idx * -height,
      transition: {
        duration: 1,
        type: 'spring',
      },
    },
  }

  return (
    <SpriteContainer variants={variants}>
      {chars.map((char, index) => {
        const charVariants = {
          initial: {
            opacity: 0.25,
          },
          animate: {
            opacity: idx === index ? 1 : 0,
            transition: {
              opacity: {
                duration: 0.5,
              },
              duration: 1,
              type: 'spring',
            },
          },
        }

        return (
          <Char variants={charVariants} key={index} color={color}>
            {char}
          </Char>
        )
      })}
    </SpriteContainer>
  )
}
