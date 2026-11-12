/**
 * The NATIVE leg's public prop surface — deliberately the SAME exported name
 * as the web leg's (`ButtonFrameCompatProps`), with the RN shape divergences
 * (`../button-compat/native-props` precedent): RN responder press handlers and an RN
 * `style`. `export-type-parity.test.ts` pins the name set across the legs and
 * the per-prop divergences by reason. Types only; RN imports are
 * type-only so any graph can resolve this file.
 */
import type { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native'
import type { ButtonFrameOpenProps } from './compile'
import type { ButtonFrameVariantProps } from './props'

export type ButtonFramePressHandler = (event: GestureResponderEvent) => void

export type ButtonFrameCompatProps = Omit<ButtonFrameOpenProps, 'style' | 'onPress'> &
  Omit<ButtonFrameVariantProps, 'onDisabledPress'> & {
    onPress?: ButtonFramePressHandler
    onDisabledPress?: ButtonFramePressHandler
    style?: StyleProp<ViewStyle>
    [key: `data-${string}`]: string | number | boolean | undefined
  }
