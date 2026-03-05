You are analyzing commits in a release to identify which commit likely introduced a bug. Your goal is to carefully examine all commits and PRs in the release range and rank them by likelihood of introducing the bug described.

## Bug Description

{{BUG_DESCRIPTION}}

## Release Context

- **Platform:** {{PLATFORM}}
- **Release:** {{RELEASE_TO}}
- **Comparing with:** {{RELEASE_FROM}}

## Your Task

Analyze ALL commits and pull requests in the release range. For each commit/PR, determine how likely it is that it introduced the bug described above. Consider:

1. **Direct relevance**: Does the commit modify code that directly relates to the bug description?
2. **Indirect impact**: Could changes in this commit cause side effects that lead to the bug?
3. **Pattern matching**: Do file paths, function names, or component names match keywords in the bug description?
4. **Timing**: If the bug appeared in this release, commits in this range are prime suspects
5. **Related PRs**: Multiple commits from the same PR may be related and should be considered together

## Output Format

You MUST return a valid JSON object with the following structure:

```json
{
  "suspiciousCommits": [
    {
      "sha": "full commit SHA",
      "confidence": 0.85,
      "reasoning": "Brief explanation of why this commit is suspicious, mentioning specific files/functions/modules changed that relate to the bug",
      "relatedPR": 1234
    }
  ],
  "summary": "Brief summary of findings: how many commits analyzed, how many suspicious commits found, and overall assessment",
  "totalCommitsAnalyzed": 247,
  "releaseContext": {
    "from": "{{RELEASE_FROM}}",
    "to": "{{RELEASE_TO}}",
    "platform": "{{PLATFORM}}"
  }
}
```

## Requirements

1. **Rank commits by confidence**: Order `suspiciousCommits` array from highest to lowest confidence
2. **Confidence scores**: Use 0.0-1.0 scale where:
   - 0.9-1.0: Very likely culprit (direct match, clear causation)
   - 0.7-0.9: Likely related (strong indirect connection)
   - 0.5-0.7: Possibly related (weak connection, worth investigating)
   - < 0.5: Unlikely (exclude from results)
3. **Return top 10-20 commits**: Focus on the most suspicious commits, not all commits
4. **Include reasoning**: Each commit must have a clear explanation of why it's suspicious
5. **Match PRs**: If a commit is part of a PR, include the PR number in `relatedPR`
6. **Be specific**: Reference specific files, functions, or components in your reasoning

## Analysis Process

Before generating your output, analyze the commit data systematically:

1. **Scan for keywords**: Look for file paths, function names, or component names that match keywords in the bug description
2. **Review PR descriptions**: PR bodies often contain context about what changed and why
3. **Check related commits**: Commits that touch similar files or components may be related
4. **Consider the full context**: Sometimes the bug is caused by an interaction between multiple changes

## Important Notes

- Analyze ALL commits provided, even if the context is truncated due to token limits
- If multiple commits from the same PR are suspicious, include them all but note they're related
- Be thorough but focused - prioritize commits with the strongest connection to the bug
- Your reasoning should help developers quickly understand why each commit is suspicious

Here is the commit data you need to analyze:

<commit_data>
{{COMMIT_DATA}}
</commit_data>

Now analyze the commits and return your JSON response with ranked suspicious commits.

