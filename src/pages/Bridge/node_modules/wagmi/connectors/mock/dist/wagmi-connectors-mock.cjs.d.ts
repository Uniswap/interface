// are you seeing an error that a default export doesn't exist but your source file has a default export?
// you should run `yarn` or `yarn preconstruct dev` if preconstruct dev isn't in your postinstall hook

// curious why you need to?
// this file exists so that you can import from the entrypoint normally
// except that it points to your source file and you don't need to run build constantly
// which means we need to re-export all of the modules from your source file
// and since export * doesn't include default exports, we need to read your source file
// to check for a default export and re-export it if it exists
// it's not ideal, but it works pretty well ¯\_(ツ)_/¯
export * from "../../../src/connectors/mock";
