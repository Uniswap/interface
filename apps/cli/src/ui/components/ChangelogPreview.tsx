import { Box as InkBox, Text } from 'ink'

interface ChangelogPreviewProps {
  changelog: string
}

export function ChangelogPreview({ changelog }: ChangelogPreviewProps): JSX.Element {
  // Split into lines and render
  const lines = changelog.split('\n')

  return (
    <InkBox borderStyle="single" padding={1} flexDirection="column">
      <Text bold>Changelog Preview</Text>
      <Text>─</Text>
      {lines.map((line, index) => (
        <Text key={index}>{line}</Text>
      ))}
    </InkBox>
  )
}
