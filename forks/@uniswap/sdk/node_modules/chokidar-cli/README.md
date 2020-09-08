# Chokidar CLI

[![Build Status](https://travis-ci.org/kimmobrunfeldt/chokidar-cli.svg?branch=master)](https://travis-ci.org/kimmobrunfeldt/chokidar-cli)

Fast cross-platform command line utility to watch file system changes.

The underlying watch library is [Chokidar](https://github.com/paulmillr/chokidar), which is one of the best watch utilities for Node. Chokidar is battle-tested:

> It is used in
> [brunch](http://brunch.io),
> [gulp](https://github.com/gulpjs/gulp/),
> [karma](http://karma-runner.github.io),
> [PM2](https://github.com/Unitech/PM2),
> [browserify](http://browserify.org/),
> [webpack](http://webpack.github.io/),
> [BrowserSync](http://www.browsersync.io/),
> [socketstream](http://www.socketstream.org),
> [derby](http://derbyjs.com/),
> and [many others](https://www.npmjs.org/browse/depended/chokidar/).
> It has proven itself in production environments.

## Install

If you need it only with NPM scripts:

```bash
npm install chokidar-cli
```

Or globally

```bash
npm install -g chokidar-cli
```

## Usage

Chokidar can be invoked using the `chokidar` command, without the `-cli` suffix.

Arguments use the form of runtime flags with string parameters, delimited by quotes. While in principal both single and double quotes are supported by `chokidar-cli`, the actual command line argument parsing is dependent on the operating system and shell used; for cross-platform compatibility, use double quotes (with escaping, if necessary), as single quotes are not universally supported by all operating systems.

This is particularly important when using chokidar-cli for run scripts specified in `package.json`. For maximum platform compatibility, make sure to use escaped double quotes around chokidar's parameters:

```
"run": {
  "chokidar": "chokidar \"**/*.js\" -c \"...\"",
  ...
},
```

## Default behavior

By default `chokidar` streams changes for all patterns to stdout:

```bash
$ chokidar "**/*.js" "**/*.less"
change:test/dir/a.js
change:test/dir/a.less
add:test/b.js
unlink:test/b.js
```

Each change is represented with format `event:relativepath`. Possible events: `add`, `unlink`, `addDir`, `unlinkDir`, `change`.

**Output only relative paths on each change**

```bash
$ chokidar "**/*.js" "**/*.less" | cut -d ":" -f 2-
test/dir/a.js
test/dir/a.less
test/b.js
test/b.js
```

**Run *npm run build-js* whenever any .js file changes in the current work directory tree**

```chokidar "**/*.js" -c "npm run build-js"```

**Watching in network directories must use polling**

```chokidar "**/*.less" -c "npm run build-less" --polling```

**Pass the path and event details in to your custom command**

```chokidar "**/*.less" -c "if [ '{event}' = 'change' ]; then npm run build-less -- {path}; fi;"```

**Detailed help**

```
Usage: chokidar <pattern> [<pattern>...] [options]

<pattern>:
Glob pattern to specify files to be watched.
Multiple patterns can be watched by separating patterns with spaces.
To prevent shell globbing, write pattern inside quotes.
Guide to globs: https://github.com/isaacs/node-glob#glob-primer


Options:
  -c, --command           Command to run after each change. Needs to be
                          surrounded with quotes when command contains spaces.
                          Instances of `{path}` or `{event}` within the command
                          will be replaced by the corresponding values from the
                          chokidar event.
  -d, --debounce          Debounce timeout in ms for executing command
                                                                  [default: 400]
  -t, --throttle          Throttle timeout in ms for executing command
                                                                  [default: 0]
  -s, --follow-symlinks   When not set, only the symlinks themselves will be
                          watched for changes instead of following the link
                          references and bubbling events through the links path
                                                      [boolean] [default: false]
  -i, --ignore            Pattern for files which should be ignored. Needs to be
                          surrounded with quotes to prevent shell globbing. The
                          whole relative or absolute path is tested, not just
                          filename. Supports glob patters or regexes using
                          format: /yourmatch/i
  --initial               When set, command is initially run once
                                                      [boolean] [default: false]
  -p, --polling           Whether to use fs.watchFile(backed by polling) instead
                          of fs.watch. This might lead to high CPU utilization.
                          It is typically necessary to set this to true to
                          successfully watch files over a network, and it may be
                          necessary to successfully watch files in other non-
                          standard situations         [boolean] [default: false]
  --poll-interval         Interval of file system polling. Effective when --
                          polling is set                          [default: 100]
  --poll-interval-binary  Interval of file system polling for binary files.
                          Effective when --polling is set         [default: 300]
  --verbose               When set, output is more verbose and human readable.
                                                      [boolean] [default: false]
  --silent                When set, internal messages of chokidar-cli won't be
                          written.                    [boolean] [default: false]
  -h, --help              Show help                                    [boolean]
  -v, --version           Show version number                          [boolean]

Examples:
  chokidar "**/*.js" -c "npm run build-js"  build when any .js file changes
  chokidar "**/*.js" "**/*.less"            output changes of .js and .less
                                            files
```

## License

MIT
