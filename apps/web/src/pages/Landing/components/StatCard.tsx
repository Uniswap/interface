import '~/pages/Landing/components/StatCard.css'
import { Flex, Text } from '@universe/mycelium'
import { styled } from '@universe/mycelium/styled'
import { useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { parseToRgb } from 'polished'
import type { ComponentPropsWithoutRef, CSSProperties } from 'react'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'

const SPRITE_HEIGHT = 60
const SPRITE_STAGGER_MS = 25
const SPRITE_RISE_DURATION_MS = 1000
const CHAR_FADE_DURATION_MS = 500
// Approximates the previous spring rise (slight overshoot, smooth settle)
const SPRITE_RISE_EASING = 'cubic-bezier(0.25, 1.25, 0.5, 1)'

const Mask = styled('div', {
  platform: 'web',
  base: 'relative flex flex-[0] min-h-[52px] w-full overflow-hidden max-[1024px]:min-h-[40px] max-[768px]:min-h-[32px]',
})

const CharFrame = styled('div', {
  platform: 'web',
  base: '[font-variant-numeric:lining-nums_tabular-nums] [font-family:Basel] text-[52px] not-italic font-[500] [line-height:52px] max-[1280px]:text-[40px] max-[1280px]:[line-height:40px] max-[1050px]:text-[32px] max-[1050px]:[line-height:32px] max-[850px]:text-[28px] max-[850px]:[line-height:28px] max-[396px]:text-[22px] max-[396px]:[line-height:22px]',
})

function Char({ color, style, ...rest }: { color: string } & ComponentPropsWithoutRef<typeof CharFrame>): JSX.Element {
  return <CharFrame style={{ color, ...style }} {...rest} />
}

const ContainerFrame = styled('div', {
  platform: 'web',
  base: 'flex flex-col items-start justify-between rounded-[20px] w-full h-full max-h-[230px] p-[32px] overflow-hidden [background-size:12px_12px] [background-position:-8.5px_-8.5px] max-[1024px]:p-[24px] max-[450px]:max-h-[160px]',
  variants: {
    live: {
      true: 'bg-[#2FBA610A]',
      false: 'bg-surface2',
    },
  },
  defaultVariants: { live: false },
})

// The dot colour derives from the theme's neutral2 at runtime, so the gradient rides an inline style
// while the 12px tiling stays in the base classes.
function Container({
  style,
  ...rest
}: ComponentPropsWithoutRef<typeof ContainerFrame> & { live?: boolean }): JSX.Element {
  const colors = useSporeColors()
  const { red, green, blue } = parseToRgb(colors.neutral2.val)
  return (
    <ContainerFrame
      style={{
        backgroundImage: `radial-gradient(rgba(${red}, ${green}, ${blue}, 0.25) 0.5px, transparent 0)`,
        ...style,
      }}
      {...rest}
    />
  )
}

// No display utility: the chars must stay block-level to stack vertically inside the flex Mask.
const SpriteContainer = styled('div', {
  platform: 'web',
  base: 'pointer-events-none text-neutral2',
})

const LiveIconFrame = styled('div', {
  platform: 'web',
  base: 'w-[6px] h-[6px] rounded-[50%] bg-success stat-card-live-icon',
})

export function LiveIcon({
  display,
  style,
  ...rest
}: { display: CSSProperties['display'] } & ComponentPropsWithoutRef<typeof LiveIconFrame>): JSX.Element {
  return <LiveIconFrame style={{ display, ...style }} {...rest} />
}

const TitleFrame = styled('h3', {
  platform: 'web',
  base: 'p-0 m-0 [font-family:Basel] text-[24px] not-italic font-[535] [line-height:32px] max-[1024px]:text-[18px] max-[1024px]:[line-height:26px] max-[768px]:text-[18px] max-[768px]:[line-height:20px]',
})

function Title({
  color,
  style,
  ...rest
}: { color: string } & ComponentPropsWithoutRef<typeof TitleFrame>): JSX.Element {
  return <TitleFrame style={{ color, ...style }} {...rest} />
}

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

// Picks the sprite "reel" a character belongs to. Falls back to a single-char charset for anything
// outside the known sets (e.g. a multi-char currency symbol like the "H" in "HK$", or a locale's own
// compact-notation unit like "万"/"亿") so that character still renders (statically, without the
// digit-roll animation) instead of silently disappearing — see CONS-3499.
export function getSpriteCharset(char: string): string[] {
  if (numeric.includes(char)) {
    return numeric
  }
  if (delineators.includes(char)) {
    return delineators
  }
  if (currency.includes(char)) {
    return currency
  }
  if (suffixes.includes(char)) {
    return suffixes
  }
  return [char]
}

export function StatCard(props: StatCardProps) {
  const colors = useSporeColors()

  return (
    <Container live={props.live}>
      <Flex row alignItems="center" gap="$gap4">
        <Title color={props.live ? colors.statusSuccess.val : colors.neutral2.val}>{props.title}</Title>
      </Flex>
      <AnimatedStringInterpolation
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

function AnimatedStringInterpolation({ value, delay, inView, live }: Omit<StatCardProps, 'title'>) {
  const chars = value.split('')
  const colors = useSporeColors()
  const locale = useCurrentLocale()

  // For Arabic locales, use simple Text component instead of animated sprites
  const isArabic = locale.startsWith('ar')
  if (isArabic) {
    return (
      <Text variant="heading2" color={live ? colors.statusSuccess.val : colors.neutral1.val} allowFontScaling={false}>
        {value}
      </Text>
    )
  }

  const baseDelayMs = 1000 * (delay ?? 0)

  return (
    <Mask>
      {chars.map((char: string, index: number) => {
        const charset = getSpriteCharset(char)

        return (
          <NumberSprite
            char={char}
            key={index}
            charset={charset}
            color={live ? colors.statusSuccess.val : colors.neutral1.val}
            inView={inView}
            delayMs={baseDelayMs + index * SPRITE_STAGGER_MS}
          />
        )
      })}
    </Mask>
  )
}

function NumberSprite({
  char,
  charset,
  color,
  inView,
  delayMs,
}: {
  char: string
  charset: string[]
  color: string
  inView?: boolean
  delayMs: number
}) {
  // rotate array so that the char is at the top
  const chars = rotateArray(charset, charset.indexOf(char))

  const idx = chars.indexOf(char)

  const initialY = idx - 3 * SPRITE_HEIGHT
  const targetY = idx * -SPRITE_HEIGHT

  return (
    <SpriteContainer
      style={{
        transform: `translateY(${inView ? targetY : initialY}px)`,
        transition: `transform ${SPRITE_RISE_DURATION_MS}ms ${SPRITE_RISE_EASING} ${delayMs}ms`,
      }}
    >
      {/* oxlint-disable-next-line no-shadow */}
      {chars.map((char, index) => (
        <Char
          key={index}
          color={color}
          style={{
            opacity: inView ? (idx === index ? 1 : 0) : 0.25,
            transition: `opacity ${CHAR_FADE_DURATION_MS}ms ease ${delayMs}ms`,
          }}
        >
          {char}
        </Char>
      ))}
    </SpriteContainer>
  )
}
