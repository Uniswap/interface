import { AppId } from '@universe/config'
import { Environment } from '@universe/environment'
import { Cli, z } from 'incur'

export const pull = Cli.create('pull', {
  description: "Fetch an app's configs and write them to its local env file.",
  args: z.object({
    app: z.enum(AppId).describe('App name'),
  }),
  options: z.object({
    env: z.enum(Environment).default(Environment.Development).describe('Environment stage'),
    overwrite: z.boolean().default(false).describe('Overwrite the env file instead of merging'),
  }),
  run(c) {
    return { todo: 'pull', app: c.args.app, env: c.options.env, overwrite: c.options.overwrite }
  },
})
