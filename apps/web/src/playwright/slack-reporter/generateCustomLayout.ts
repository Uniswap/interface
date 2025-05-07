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
        text: `:white_check_mark: *${summaryResults.passed}* | :x: *${summaryResults.failed}* | :large_yellow_circle: *${summaryResults.skipped}* | :fast_forward: *${summaryResults.flaky}*`,
      },
    },
    ...meta,
    ...(summaryResults.failures.length > 0
      ? [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: summaryResults.failures.map((failure) => `:exclamation: ${failure.test}`).join('\n'),
            },
          },
        ]
      : []),
  ]
}
exports.generateCustomLayout = generateCustomLayout
