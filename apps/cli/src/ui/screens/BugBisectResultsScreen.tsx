import { join } from 'node:path'
import { Select } from '@universe/cli/src/ui/components/Select'
import { TextInput } from '@universe/cli/src/ui/components/TextInput'
import { useAppState } from '@universe/cli/src/ui/hooks/useAppState'
import { useRepository } from '@universe/cli/src/ui/hooks/useRepository'
import { colors } from '@universe/cli/src/ui/utils/colors'
import { Box as InkBox, Text, useInput } from 'ink'
import { useCallback, useMemo, useState } from 'react'

interface BugBisectResultsScreenProps {
  results: { changelog: string; metadata: unknown }
  onRestart: () => void
}

interface SuspiciousCommit {
  sha: string
  confidence: number
  reasoning: string
  relatedPR?: number
}

interface BugBisectResults {
  suspiciousCommits?: SuspiciousCommit[]
  summary?: string
  totalCommitsAnalyzed?: number
  releaseContext?: {
    from: string
    to: string
    platform: string
  }
}

type ViewMode = 'menu' | 'save-file' | 'saved'

function isValidBugBisectResults(value: unknown): value is BugBisectResults {
  return (
    typeof value === 'object' &&
    value !== null &&
    'suspiciousCommits' in value &&
    Array.isArray((value as BugBisectResults).suspiciousCommits)
  )
}

function tryParseFromString(jsonString: string): BugBisectResults | null {
  try {
    const parsed = JSON.parse(jsonString) as BugBisectResults
    if (isValidBugBisectResults(parsed)) {
      return parsed
    }
  } catch {
    // Not valid JSON or not valid BugBisectResults
  }
  return null
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.9) {
    return 'red'
  }
  if (confidence >= 0.7) {
    return '#ff8c00'
  } // orange
  if (confidence >= 0.5) {
    return 'yellow'
  }
  return 'gray'
}

function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.9) {
    return 'Very Likely'
  }
  if (confidence >= 0.7) {
    return 'Likely'
  }
  if (confidence >= 0.5) {
    return 'Possible'
  }
  return 'Unlikely'
}

export function BugBisectResultsScreen({ results, onRestart }: BugBisectResultsScreenProps): JSX.Element {
  const { state } = useAppState()
  const { repository } = useRepository()
  const [viewMode, setViewMode] = useState<ViewMode>('menu')
  const [filename, setFilename] = useState('bug-bisect-results.json')
  const [filepath, setFilepath] = useState(process.cwd())
  const [savedPath, setSavedPath] = useState('')
  const [focusedIndex, setFocusedIndex] = useState(0)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)

  // Parse results
  const parsedResults = useMemo((): BugBisectResults | null => {
    try {
      // Try to parse from metadata if it's already parsed
      if (results.metadata && typeof results.metadata === 'object') {
        const metadata = results.metadata as Record<string, unknown>
        if (isValidBugBisectResults(metadata)) {
          return metadata
        }
      }

      // Try to parse from changelog string (might be JSON)
      if (typeof results.changelog === 'string') {
        const parsed = tryParseFromString(results.changelog)
        if (parsed) {
          return parsed
        }
      }

      // Try to parse from metadata.analysis if it's a string
      if (results.metadata && typeof results.metadata === 'object') {
        const metadata = results.metadata as Record<string, unknown>
        const analysisString = metadata.analysis
        if (typeof analysisString === 'string') {
          const parsed = tryParseFromString(analysisString)
          if (parsed) {
            return parsed
          }
        }
      }

      return null
    } catch {
      return null
    }
  }, [results])

  const bugResults = useMemo((): BugBisectResults => {
    if (parsedResults) {
      return parsedResults
    }
    return {
      suspiciousCommits: [],
      summary: 'Failed to parse results',
      totalCommitsAnalyzed: 0,
      releaseContext: state.selectedRelease
        ? {
            from: state.comparisonRelease?.version || 'unknown',
            to: state.selectedRelease.version,
            platform: state.selectedRelease.platform,
          }
        : undefined,
    }
  }, [parsedResults, state.selectedRelease, state.comparisonRelease])

  const githubBaseUrl = repository ? `https://github.com/${repository.owner}/${repository.name}` : ''

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
      const content = JSON.stringify(bugResults, null, 2)
      await Bun.write(fullPath, content)
      setSavedPath(fullPath)
      setViewMode('saved')
      setSaveError(null)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save file')
    }
  }, [filepath, filename, bugResults])

  // Handle input for save-file mode (similar to ResultsScreen)
  useInput(
    useCallback(
      (input, key) => {
        if (viewMode !== 'save-file') {
          return
        }

        const isEditing = editingIndex !== null

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
              setEditingIndex(focusedIndex)
              setEditValue(focusedIndex === 0 ? filename : filepath)
            } else if (focusedIndex === 2) {
              saveFile().catch(() => {
                // Error already handled in saveFile
              })
            }
            return
          }
        }

        if (isEditing) {
          if (key.return) {
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
      (_input, key) => {
        if (viewMode === 'saved' && (key.return || key.escape)) {
          setViewMode('menu')
          setFocusedIndex(0)
        }
      },
      [viewMode],
    ),
  )

  if (viewMode === 'save-file') {
    return (
      <InkBox flexDirection="column" paddingX={2}>
        <InkBox marginBottom={2}>
          <Text bold color={colors.primary}>
            Save Results to File
          </Text>
        </InkBox>

        <InkBox flexDirection="column">
          <TextInput
            label="Filename"
            value={filename}
            focused={focusedIndex === 0}
            isEditing={editingIndex === 0}
            editValue={editingIndex === 0 ? editValue : undefined}
            placeholder="bug-bisect-results.json"
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

          <InkBox marginTop={1}>
            <Text color={focusedIndex === 2 ? colors.primary : undefined} bold={focusedIndex === 2}>
              {focusedIndex === 2 ? '❯ ' : '  '}
              Save File
            </Text>
          </InkBox>

          {saveError && (
            <InkBox marginTop={1}>
              <Text color="red">Error: {saveError}</Text>
            </InkBox>
          )}

          <InkBox marginTop={2}>
            <Text dimColor>
              Use ↑↓ to navigate, Enter to edit/save, Esc to {editingIndex !== null ? 'cancel' : 'go back'}
            </Text>
          </InkBox>
        </InkBox>
      </InkBox>
    )
  }

  if (viewMode === 'saved') {
    return (
      <InkBox flexDirection="column" paddingX={2}>
        <InkBox marginBottom={2}>
          <Text bold color="green">
            ✓ File Saved Successfully
          </Text>
        </InkBox>

        <InkBox flexDirection="column">
          <Text>
            Saved to:{' '}
            <Text bold color={colors.primary}>
              {savedPath}
            </Text>
          </Text>

          <InkBox marginTop={2}>
            <Text dimColor>Press Enter or Esc to return to menu</Text>
          </InkBox>
        </InkBox>
      </InkBox>
    )
  }

  const suspiciousCommits = bugResults.suspiciousCommits || []

  return (
    <InkBox flexDirection="column" paddingX={2}>
      <InkBox marginBottom={2}>
        <Text bold color="green">
          ✓ Bug Analysis Complete
        </Text>
      </InkBox>

      <InkBox flexDirection="column">
        {/* Bug Description */}
        {state.bugDescription && (
          <InkBox flexDirection="column" marginBottom={2}>
            <Text bold>Bug Description</Text>
            <Text>{state.bugDescription}</Text>
          </InkBox>
        )}

        {/* Release Context */}
        {bugResults.releaseContext && (
          <InkBox flexDirection="column" marginBottom={2}>
            <Text dimColor>
              <Text bold>Platform:</Text> {bugResults.releaseContext.platform}
            </Text>
            <Text dimColor>
              <Text bold>Release:</Text> {bugResults.releaseContext.from} → {bugResults.releaseContext.to}
            </Text>
            {bugResults.totalCommitsAnalyzed !== undefined && (
              <Text dimColor>
                <Text bold>Commits Analyzed:</Text> {bugResults.totalCommitsAnalyzed}
              </Text>
            )}
          </InkBox>
        )}

        {/* Summary */}
        {bugResults.summary && (
          <InkBox marginBottom={2}>
            <Text dimColor>{bugResults.summary}</Text>
          </InkBox>
        )}

        {/* Suspicious Commits */}
        {suspiciousCommits.length > 0 ? (
          <InkBox flexDirection="column" marginBottom={2}>
            <InkBox marginBottom={1}>
              <Text bold color={colors.primary}>
                Suspicious Commits ({suspiciousCommits.length})
              </Text>
            </InkBox>

            {suspiciousCommits.slice(0, 20).map((commit, index) => {
              const confidenceColor = getConfidenceColor(commit.confidence)
              const confidenceLabel = getConfidenceLabel(commit.confidence)
              const shortSha = commit.sha.slice(0, 7)
              const commitUrl = githubBaseUrl ? `${githubBaseUrl}/commit/${commit.sha}` : ''
              const prUrl = commit.relatedPR && githubBaseUrl ? `${githubBaseUrl}/pull/${commit.relatedPR}` : ''

              return (
                <InkBox key={commit.sha} flexDirection="column" marginBottom={2}>
                  <InkBox flexDirection="row">
                    <Text bold>
                      #{index + 1}. {shortSha}
                    </Text>
                    <Text> </Text>
                    <Text color={confidenceColor}>
                      {confidenceLabel} ({Math.round(commit.confidence * 100)}%)
                    </Text>
                  </InkBox>

                  <InkBox flexDirection="column">
                    <Text dimColor>
                      {commitUrl ? (
                        <Text>
                          <Text underline>{commitUrl}</Text>
                        </Text>
                      ) : (
                        <Text>SHA: {commit.sha}</Text>
                      )}
                    </Text>
                    {commit.relatedPR && (
                      <Text dimColor>
                        PR #{commit.relatedPR}
                        {prUrl && (
                          <Text>
                            {' '}
                            - <Text underline>{prUrl}</Text>
                          </Text>
                        )}
                      </Text>
                    )}
                  </InkBox>

                  <InkBox flexDirection="column" marginTop={1}>
                    <Text>{commit.reasoning}</Text>
                  </InkBox>
                </InkBox>
              )
            })}

            {suspiciousCommits.length > 20 && (
              <InkBox marginTop={1}>
                <Text dimColor>... and {suspiciousCommits.length - 20} more commits</Text>
              </InkBox>
            )}
          </InkBox>
        ) : (
          <InkBox marginBottom={2}>
            <Text color="yellow">⚠ No suspicious commits found</Text>
          </InkBox>
        )}

        <InkBox marginTop={2} marginBottom={1}>
          <Text bold color={colors.primary}>
            What would you like to do next?
          </Text>
        </InkBox>

        <Select items={options} onSelect={handleSelect} />
      </InkBox>
    </InkBox>
  )
}
