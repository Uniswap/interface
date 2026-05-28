// @ts-nocheck
function generateCustomLayout(summaryResults) {
  const meta = []
  if (summaryResults.meta) {
    for (let i = 0; i < summaryResults.meta.length; i += 1) {
      const { key, value } = summaryResults.meta[i]
      meta.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `\n*${key}*: ${value}`,
        },
      })
    }
  }

  // Build status text, only showing categories with at least one test
  const statusParts = []
  if (summaryResults.passed > 0) {
    statusParts.push(`:white_check_mark: *${summaryResults.passed} tests passed*`)
  }
  if (summaryResults.failed > 0) {
    statusParts.push(`:x: *${summaryResults.failed} tests failed*`)
  }
  if (summaryResults.skipped > 0) {
    statusParts.push(`:large_yellow_circle: *${summaryResults.skipped} tests skipped*`)
  }
  if (summaryResults.flaky > 0) {
    statusParts.push(`:fast_forward: *${summaryResults.flaky} tests flaky*`)
  }

  return [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🎭 Playwright E2E Test Results',
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: statusParts.join('\n'),
      },
    },
    ...meta,
    ...(summaryResults.failures && summaryResults.failures.length > 0
      ? [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: summaryResults.failures
                .map((failure) => {
                  // Format: Suite → Test
                  const testInfo = `${failure.suite} → ${failure.test.replace(` [${failure.browser || 'chromium'}]`, '')}`

                  // Extract a simplified error message
                  let errorMessage = 'Test failed'

                  if (failure.failureReason) {
                    if (failure.failureReason.includes('Test timeout')) {
                      errorMessage = 'Test timeout exceeded'
                    } else if (failure.failureReason.includes('expect.toBeVisible')) {
                      errorMessage = 'Element not visible'
                    } else if (failure.failureReason.includes('strict mode violation')) {
                      // Extract the element name from the error
                      const match = failure.failureReason.match(/getByText\('([^']+)'\)/)
                      if (match && match[1]) {
                        errorMessage = `Element "${match[1]}" not found`
                      } else {
                        errorMessage = 'Element not found'
                      }
                    }
                  }

                  return `:exclamation: ${testInfo}\n_${errorMessage}_`
                })
                .join('\n\n'),
            },
          },
        ]
      : []),
  ]
}
exports.generateCustomLayout = generateCustomLayout
