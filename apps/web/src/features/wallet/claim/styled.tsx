import { Flex } from '@universe/mycelium'
import { styled, type StyledComponent } from '@universe/mycelium/styled'
import uImage from '~/assets/images/big_unicorn.png'
import noise from '~/assets/images/noise.png'
import xlUnicorn from '~/assets/images/xl_uni.png'

const DESATURATE_VARIANTS = {
  desaturate: { true: '[filter:saturate(0)]', false: '' },
} as const

// The build-hashed asset URLs cannot be class literals, so the backgrounds ride the inline lane.
export const CardBGImage: StyledComponent<'span', typeof DESATURATE_VARIANTS> = styled('span', {
  platform: 'web',
  base: 'w-[1000px] h-[600px] absolute rounded-[12px] opacity-[0.4] top-[-100px] left-[-100px] [transform:rotate(-15deg)] select-none',
  variants: DESATURATE_VARIANTS,
  inlineStyle: () => ({ background: `url(${uImage})` }),
})

export const CardBGImageSmaller: StyledComponent<'span', typeof DESATURATE_VARIANTS> = styled('span', {
  platform: 'web',
  base: 'w-[1200px] h-[1200px] absolute rounded-[12px] top-[-300px] left-[-300px] opacity-[0.4] select-none',
  variants: DESATURATE_VARIANTS,
  inlineStyle: () => ({ background: `url(${xlUnicorn})` }),
})

const CARD_NOISE_VARIANTS = {} as const

// background-size lives in the inline lane WITH the background shorthand: the shorthand resets
// background-size, and inline style would beat a bg-cover class.
export const CardNoise: StyledComponent<'span', typeof CARD_NOISE_VARIANTS> = styled('span', {
  platform: 'web',
  variants: CARD_NOISE_VARIANTS,
  base: '[mix-blend-mode:overlay] rounded-[12px] w-[100%] h-[100%] opacity-[0.15] absolute top-[0px] left-[0px] select-none',
  inlineStyle: () => ({ background: `url(${noise})`, backgroundSize: 'cover' }),
})

const CARD_SECTION_VARIANTS = {
  disabled: { true: 'opacity-[0.4]', false: '' },
} as const

export const CardSection: StyledComponent<typeof Flex, typeof CARD_SECTION_VARIANTS> = styled(Flex, {
  base: 'p-[16px] z-[1]',
  variants: CARD_SECTION_VARIANTS,
})

const BREAK_VARIANTS = {} as const

export const Break: StyledComponent<'div', typeof BREAK_VARIANTS> = styled('div', {
  platform: 'web',
  variants: BREAK_VARIANTS,
  base: 'w-[100%] h-[1px] bg-[rgba(255,255,255,0.2)]',
})
