const path = require("path");
const options = require("./webpack.config");

options.resolve.alias = {
  // NOTE(peter): for whatever reason react is being installed in multiple places and breaking tamagui
  // this was the best i could do to ensure it pulls the correct version until i figure out why. this is what's supposed to happen anyway
  // if you find yourself here, run `ls node_modules/react` and if the folder exists, this stays, if it doesn't, you can safely remove
  // "app": path.resolve(__dirname, "../../packages"),
  "react-dom": path.resolve("../../node_modules/react-dom"),
  "react-native$": "react-native-web",
  // "ui": path.resolve(__dirname, "../../packages/ui/src"),
  react: path.resolve("../../node_modules/react"),
};

module.exports = options;