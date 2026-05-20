import { AppId } from '@universe/config'
import { Environment } from '@universe/environment'
import { Cli, z } from 'incur'

export const view = Cli.create('view', {
  description: "Print an app's config parameters to stdout.",
  args: z.object({
    app: z.enum(AppId).describe('App name'),
  }),
  options: z.object({
    env: z.enum(Environment).default(Environment.Development).describe('Environment stage'),
    format: z.enum(['table', 'json', 'dotenv', 'github']).default('table').describe('Output format'),
  }),
  run(c) {
    return { todo: 'view', app: c.args.app, env: c.options.env, format: c.options.format }
  },
})
