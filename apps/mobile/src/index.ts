// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../index.d.ts" />

// TODO - remove this declaration after updating react-native-reanimted
// to the never version (3.3.0 has typescript type issues and is missing
// this declaration in the react-native-reanimated.d.ts file)
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toHaveAnimatedStyle(
        style: Record<string, unknown>[] | Record<string, unknown>,
        config?: {
          shouldMatchAllProps?: boolean
        }
      ): R
    }
  }
}

export {}
