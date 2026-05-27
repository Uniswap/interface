import { AppId } from '@universe/config'
import { Environment } from '@universe/environment'
import { Cli, z } from 'incur'
import { unwrap } from '../errors'
import { envName, lastSegment, escapeValue } from '../lib/format/format'
import { promptForConfirmation } from '../lib/prompt'
import { buildConfigClient, createConfigFetcherService } from '../services/configFetcher'
import { vars } from '../vars'

export const view = Cli.create('view', {
  description: "Print an app's config parameters to stdout.",
  args: z.object({
    app: z.enum(AppId).describe('App name'),
  }),
  options: z.object({
    env: z.enum(Environment).default(Environment.Development).describe('Environment stage'),
    dotenv: z.boolean().default(false).describe('Output as KEY=value lines for .env files or $GITHUB_ENV'),
  }),
  async run(c) {
    await promptForConfirmation(
      `Print ${c.args.app} config parameters in ${c.options.env}? Agents such as Claude or Cursor should not use this command as it may leak sensitive information.`,
    )
    const { auth } = vars(c)
    const client = await unwrap(buildConfigClient({ auth, environment: c.options.env }))
    const fetcher = createConfigFetcherService({ client })

    const parameters = await unwrap(fetcher.getParameterValuesInScope(`/${c.args.app}`))

    if (parameters.length === 0) {
      return c.error({
        code: 'NotFound',
        message: `No parameters found for app "${c.args.app}" in ${c.options.env}`,
      })
    }

    if (c.options.dotenv) {
      return parameters.flatMap((p) => (p.key ? [`${envName(p.key)}=${escapeValue(p.value ?? '')}`] : [])).join('\n')
    }

    return {
      parameters: parameters.map((p) => ({
        key: p.key,
        name: lastSegment(p.key ?? ''),
        value: p.value,
        author: p.author,
      })),
    }
  },
})
