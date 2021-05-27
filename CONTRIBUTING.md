Thank you for your interest in contributing to the Uniswap interface! 🦄

# Coding

See [README.md](https://github.com/Uniswap/uniswap-interface/blob/main/README.md) for instructions on running the app locally.

Start with issues with label [good first issue](https://github.com/Uniswap/uniswap-interface/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22).

# Translations

Help Uniswap cover more languages!

Uniswap interface uses PO file to manage translations. See [Working with PO Files](https://www.gnu.org/software/trans-coord/manual/gnun/html_node/PO-Files.html#PO-Files)

## Starting a New Translation

Uniswap interface uses [LinguiJS](https://lingui.js.org/) to manage locales and translations.

- Follow instructions in [README.md](https://github.com/Uniswap/uniswap-interface/blob/main/README.md) for instructions on running the app locally to clone Uniswap interface locally
- Add locale to locales array in [lingui.config.js](https://github.com/Uniswap/uniswap-interface/blob/main/lingui.config.js#L14)
- Add locale to locales array in [i18n.tsx](https://github.com/Uniswap/uniswap-interface/blob/main/src/i18n.tsx#L7)
- Run `yarn i18n:extract` to generate messages.po inside [src/locales/{locale}](https://github.com/Uniswap/uniswap-interface/tree/main/src/locales)
- Continue to Editing Translations below

## Existing Translation

- Edit [src/locales](https://github.com/Uniswap/uniswap-interface/tree/main/src/locales)/{locale}/messages.po either manually or with a PO editor (see [Editing PO Files](https://www.gnu.org/software/trans-coord/manual/web-trans/html_node/PO-Editors.html)).
- Run `yarn i18n:compile` to generate src/locales/{locale}/messages.js
- Run `yarn start` to start a server locally to verify changes
- Submit PR against main
