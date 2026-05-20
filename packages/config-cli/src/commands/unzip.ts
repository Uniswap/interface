import { Cli, z } from 'incur'

export const unzip = Cli.create('unzip', {
  description: "Unpack a config zip into each app's env file location.",
  args: z.object({
    file: z.string().describe('Path to the config zip file'),
  }),
  options: z.object({
    overwrite: z.boolean().default(true).describe('Overwrite existing env files instead of merging'),
  }),
  run(c) {
    return { todo: 'unzip', file: c.args.file, overwrite: c.options.overwrite }
  },
})
