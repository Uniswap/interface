import { Text, View } from 'react-native'

/**
 * Reference example + typecheck smoke test for the uniwind integration.
 *
 * Demonstrates styling React Native primitives with `className` using the shared
 * @universe/tailwind tokens (the same semantic names as web: surface*, neutral*,
 * accent*, the typography scale, named radii). The dark/light values resolve
 * through uniwind's theme, driven by Uniwind.setTheme() in src/app/App.tsx.
 *
 * Not wired into navigation — it exists to document the setup and to exercise the
 * className type augmentation + shared token utilities at typecheck time.
 */
export function UniwindExample(): JSX.Element {
  return (
    <View className="flex-1 items-center justify-center gap-2 bg-surface1 p-4">
      <Text className="text-heading-3 text-neutral1">Uniwind is wired up</Text>
      <Text className="text-body-2 text-neutral2">Shared tokens via @universe/tailwind/native</Text>
      <View className="rounded-16 bg-accent2 px-3 py-2">
        <Text className="text-button-3 text-accent1">bg-surface1 · text-neutral1 · rounded-16</Text>
      </View>
    </View>
  )
}
