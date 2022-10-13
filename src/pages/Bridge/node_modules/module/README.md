# module [![NPM version](http://img.shields.io/npm/v/module.svg?style=flat-square)](https://www.npmjs.org/package/module)

Generate the minimal skeleton/boilerplate for a new Node.js module.

## Installation

Install the package with NPM:

```bash
$ npm install -g module
```

## Usage

For example, to create a module in the current working directory:

```bash
$ module
```

And to create a module in another directory, specify a relative or absolute path:

```bash
$ module hello
```

If the directory doesn't exist yet, it will be automatically created.

The following boilerplate files are generated for you:

- `package.json`
- `index.js`
- `cli.js`
- `README.md`
- `.gitignore`
