import { join } from 'node:path'
import { ChangelogPreview } from '@universe/cli/src/ui/components/ChangelogPreview'
import { Select } from '@universe/cli/src/ui/components/Select'
import { TextInput } from '@universe/cli/src/ui/components/TextInput'
import { colors } from '@universe/cli/src/ui/utils/colors'
import { Box, Text, useInput } from 'ink'
import { useCallback, useState } from 'react'

interface ResultsScreenProps {
  results: { changelog: string; metadata: unknown }
  onRestart: () => void
}

type ViewMode = 'menu' | 'save-file' | 'saved'

export function ResultsScreen({ results, onRestart }: ResultsScreenProps): JSX.Element {
  // Extract changelog from results
  const changelog = results.changelog || JSON.stringify(results, null, 2)

  const [viewMode, setViewMode] = useState<ViewMode>('menu')
  const [filename, setFilename] = useState('changelog.md')
  const [filepath, setFilepath] = useState(process.cwd())
  const [savedPath, setSavedPath] = useState('')
  const [focusedIndex, setFocusedIndex] = useState(0)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)

  const options = [
    { label: 'Save to File', value: 'save' },
    { label: 'Start Over', value: 'restart' },
    { label: 'Quit', value: 'quit' },
  ]

  const handleSelect = (option: { label: string; value: string }): void => {
    if (option.value === 'quit') {
      process.exit(0)
    } else if (option.value === 'restart') {
      onRestart()
    } else if (option.value === 'save') {
      setViewMode('save-file')
    }
  }

  const saveFile = useCallback(async () => {
    try {
      const fullPath = join(filepath, filename)
      await Bun.write(fullPath, changelog)
      setSavedPath(fullPath)
      setViewMode('saved')
      setSaveError(null)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save file')
    }
  }, [filepath, filename, changelog])

  // Handle input for save-file mode
  useInput(
    useCallback(
      (
        input: string,
        key: {
          escape?: boolean
          upArrow?: boolean
          downArrow?: boolean
          return?: boolean
          backspace?: boolean
          delete?: boolean
        },
      ) => {
        if (viewMode !== 'save-file') {
          return
        }

        const isEditing = editingIndex !== null

        // Handle escape - cancel editing or go back to menu
        if (key.escape) {
          if (isEditing) {
            setEditingIndex(null)
            setEditValue('')
          } else {
            setViewMode('menu')
            setFocusedIndex(0)
            setSaveError(null)
          }
          return
        }

        // Handle navigation when not editing
        if (!isEditing) {
          if (key.upArrow) {
            setFocusedIndex((prev) => Math.max(0, prev - 1))
            return
          }
          if (key.downArrow) {
            setFocusedIndex((prev) => Math.min(2, prev + 1))
            return
          }
          if (key.return) {
            if (focusedIndex === 0 || focusedIndex === 1) {
              // Start editing
              setEditingIndex(focusedIndex)
              setEditValue(focusedIndex === 0 ? filename : filepath)
            } else if (focusedIndex === 2) {
              // Save
              // eslint-disable-next-line @typescript-eslint/no-floating-promises -- Intentionally fire-and-forget promise
              saveFile()
            }
            return
          }
        }

        // Handle editing
        if (isEditing) {
          if (key.return) {
            // Save edit
            if (editingIndex === 0) {
              setFilename(editValue)
            } else if (editingIndex === 1) {
              setFilepath(editValue)
            }
            setEditingIndex(null)
            setEditValue('')
            return
          }

          if (key.backspace || key.delete) {
            setEditValue((prev) => prev.slice(0, -1))
            return
          }

          if (input && input.length === 1) {
            setEditValue((prev) => prev + input)
            return
          }
        }
      },
      [viewMode, focusedIndex, editingIndex, editValue, filename, filepath, saveFile],
    ),
  )

  // Handle input for saved mode
  useInput(
    useCallback(
      (_input: string, key: { escape?: boolean; return?: boolean }) => {
        if (viewMode !== 'saved') {
          return
        }

        if (key.return || key.escape) {
          setViewMode('menu')
          setFocusedIndex(0)
        }
      },
      [viewMode],
    ),
  )

  if (viewMode === 'save-file') {
    return (
      <Box flexDirection="column" paddingX={2}>
        <Box marginBottom={2}>
          <Text bold color={colors.primary}>
            Save Changelog to File
          </Text>
        </Box>

        <Box flexDirection="column">
          <TextInput
            label="Filename"
            value={filename}
            focused={focusedIndex === 0}
            isEditing={editingIndex === 0}
            editValue={editingIndex === 0 ? editValue : undefined}
            placeholder="changelog.md"
            onChange={setFilename}
          />
          <TextInput
            label="Location"
            value={filepath}
            focused={focusedIndex === 1}
            isEditing={editingIndex === 1}
            editValue={editingIndex === 1 ? editValue : undefined}
            placeholder={process.cwd()}
            onChange={setFilepath}
          />

          <Box marginTop={1}>
            <Text color={focusedIndex === 2 ? colors.primary : undefined} bold={focusedIndex === 2}>
              {focusedIndex === 2 ? '❯ ' : '  '}
              Save File
            </Text>
          </Box>

          {saveError && (
            <Box marginTop={1}>
              <Text color="red">Error: {saveError}</Text>
            </Box>
          )}

          <Box marginTop={2}>
            <Text dimColor>
              Use ↑↓ to navigate, Enter to edit/save, Esc to {editingIndex !== null ? 'cancel' : 'go back'}
            </Text>
          </Box>
        </Box>
      </Box>
    )
  }

  if (viewMode === 'saved') {
    return (
      <Box flexDirection="column" paddingX={2}>
        <Box marginBottom={2}>
          <Text bold color="green">
            ✓ File Saved Successfully
          </Text>
        </Box>

        <Box flexDirection="column">
          <Text>
            Saved to:{' '}
            <Text bold color={colors.primary}>
              {savedPath}
            </Text>
          </Text>

          <Box marginTop={2}>
            <Text dimColor>Press Enter or Esc to return to menu</Text>
          </Box>
        </Box>
      </Box>
    )
  }

  return (
    <Box flexDirection="column" paddingX={2}>
      <Box marginBottom={2}>
        <Text bold color="green">
          ✓ Changelog Generated
        </Text>
      </Box>

      <Box flexDirection="column">
        <ChangelogPreview changelog={changelog} />

        <Box marginTop={2} marginBottom={1}>
          <Text bold color={colors.primary}>
            What would you like to do next?
          </Text>
        </Box>

        <Select items={options} onSelect={handleSelect} />
      </Box>
    </Box>
  )
}
