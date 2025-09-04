# Uniswap Wallet

[Uniswap Wallet](https://wallet.uniswap.org/) is the simplest, safest, and most powerful self-custodial crypto wallet. It is developed by the Uniswap Labs team, inventors of the Uniswap Protocol.

If you have suggestions on how we can improve the app, or would like to report a bug or a problem, check out the [Uniswap Help Center](https://support.uniswap.org/).

## Table of contents

- [Setup](#setup)
 - [Packages and Software](#packages-and-software)
 - [iOS Setup](#ios-setup)
   - [Xcode](#xcode)
   - [Add Xcode Command Line Tools](#add-xcode-command-line-tools)
 - [Android Setup](#android-setup)
   - [Deploying to Physical Android Device](#deploying-to-physical-android-device)
- [Development](#development)
 - [Environment variables](#environment-variables)
 - [Compile contract ABI types](#compile-contract-abi-types) 
 - [Run the app](#run-the-app)
 - [Using Radon IDE](#using-radon-ide-vscodecursor-extension)
   - [Running on a Physical iOS Device](#running-on-a-physical-ios-device)
- [Important Libraries and Tools](#important-libraries-and-tools)
- [Migrations](#migrations)
- [Testing & Performance](#testing--performance)
 - [Build local app files](./docs/build-app-files.md)
 - [E2E testing](./docs/e2e-testing.md)
 - [Performance monitoring](./docs/perf-monitoring.md)
- [Troubleshooting](#troubleshooting)
 - [Common issues](#common-issues)
 - [Common fixes](#common-fixes)
 - [Shell profile setup](#shell-profile-setup)

## Setup

This guide assumes that:

- You are using a Mac (you will need a Mac computer in order to run the Xcode iOS Simulator)
- You are using an Apple Silicon Mac (if you’re not sure, go to  → About this Mac and check if the chip name starts with "Apple")

Note: If you are indeed using an Apple Silicon Mac, we recommend setting up your environment _without_ using Rosetta. Some instructions on how to do that can be found [here](https://medium.com/@davidjasonharding/developing-a-react-native-app-on-an-m1-mac-without-rosetta-29fcc7314d70).

- [React Native Requirements](#packages-and-software)
- [iOS Setup](#ios-setup)
  - NOTE: Start downloading [Xcode](#xcode) first since it's a large file
- [Android Setup](#android-setup)

### Packages and Software

1. Install `homebrew`. We’ll be using Homebrew to install many of the other required tools through the command line. Open a terminal and Copy and paste the command from [brew.sh](https://brew.sh/) into your terminal and run it
2. Install `nvm` [Node Version Manager](https://github.com/nvm-sh/nvm) While not required, it makes it easy to install Node and switch between different versions. Use the version of `node` specified in `.nvmrc`.

   - Copy the curl command listed under _Install & Update Script_ on [this page](https://github.com/nvm-sh/nvm#install--update-script) and run it in your terminal.
   - To make sure nvm installed correctly, try running `nvm -v` (you may need to re-source your shell with `source {base config}`). It should return a version number. If it returns something like `zsh: command not found: nvm`, it hasn’t been installed correctly.

3. Install `node`

    Run the following command in your terminal:

    ```bash
    nvm install 18
    nvm use 18
    ```

    Quit and re-open the terminal, and then run to confirm that v18 is running

    ```bash
    > node -v
    v18.20.4
    ```

    Alternatively, to automatically try to find and use an `.nvmrc` file in your workspace, per the [official nvm docs for zsh](https://github.com/nvm-sh/nvm?tab=readme-ov-file#zsh), add the following script to your shell (typically `~/.zshrc` on mac):

    ```zsh
    # place this after nvm initialization!
    autoload -U add-zsh-hook

    load-nvmrc() {
      local nvmrc_path
      nvmrc_path="$(nvm_find_nvmrc)"

      if [ -n "$nvmrc_path" ]; then
        local nvmrc_node_version
        nvmrc_node_version=$(nvm version "$(cat "${nvmrc_path}")")

        if [ "$nvmrc_node_version" = "N/A" ]; then
          nvm install
        elif [ "$nvmrc_node_version" != "$(nvm version)" ]; then
          nvm use
          # Optionally, add `>/dev/null 2>&1` after `nvm use` to suppress output
        fi
      elif [ -n "$(PWD=$OLDPWD nvm_find_nvmrc)" ] && [ "$(nvm version)" != "$(nvm version default)" ]; then
        echo "Reverting to nvm default version"
        nvm use default
      fi
    }

    add-zsh-hook chpwd load-nvmrc
    load-nvmrc
    ```

4. Install `bun`. We use bun as our package manager and to run scripts.

    Run the following command to install it (npm comes with node, so it should work if the above step has been completed correctly)

    ```bash
    curl -fsSL https://bun.sh/install | bash
    ```

    Check version to verify installation

    ```bash
    > bun -v
    3.2.3
    ```

5. Install `ruby`

    Use `rbenv` to install a specific version of `ruby`:

    ```bash
    brew install rbenv ruby-build
    ```

    Run init and follow the instructions to complete the installation.

    ```bash
    rbenv init
    ```

    After following the instructions, make sure you `source` your `.zshrc` or `.bash_profile`, or start a new terminal session.

    Install a version of `ruby` and set as the default.

    ```bash
    rbenv install 3.2.2
    rbenv global 3.2.2
    ```

6. Install cocoapods and fastlane using bundler (make sure to run in `mobile`)

    ```bash
    bundle install
    ```

    Note: In the case you run into permission issues when installing ruby, [you may need to add some permissions to make it work.](https://stackoverflow.com/a/50181250)

### iOS Setup

#### Xcode

You should start with downloading Xcode if you don't already have it installed, since the file is so large. You can find it here: [developer.apple.com/xcode](https://developer.apple.com/xcode/)

You must use the [Required Xcode Version](https://github.com/Uniswap/universe/blob/main/apps/mobile/scripts/podinstall.sh#L5) to compile the app. [Older versions of xCode can be found here](https://developer.apple.com/download/all/?q=xcode).

#### Add Xcode Command Line Tools

Open Xcode and go to:

`Preferences → Locations → Command Line Tools`

Select the version that pops up.

### Android Setup

1. Install [Android Studio](https://developer.android.com/studio)
2. Install the JDK. Taken from [RN instructions](https://reactnative.dev/docs/set-up-your-environment?platform=android)

    ```bash
    brew install --cask zulu@17

    # Get path to where cask was installed to double-click installer
    brew info --cask zulu@17
    ```

    Add the following to your .rc file
    `export JAVA_HOME=/Library/Java/JavaVirtualMachines/zulu-17.jdk/Contents/Home`

    [Also verify that in Android Studio it is using the correct JDK.](https://developer.android.com/build/jdks#jdk-config-in-studio)

3. Add the following to your `.rc` file

    ```bash
    export ANDROID_HOME=$HOME/Library/Android/sdk
    export PATH=$PATH:$ANDROID_HOME/emulator
    export PATH=$PATH:$ANDROID_HOME/platform-tools
    ```

4. Install an emulator. Android Studio should have an emulator already, but if not:
   Open the project at `universe/apps/mobile/android`
   Tools -> Device Manager to create a new emulator

#### Deploying to Physical Android Device

1. Enable developer mode on Android

   - Open Settings
   - Tap About phone or About device
   - Tap Software information
   - Tap Build number seven times in a row
   - A message will appear when you're close to enabling Developer mode
   - Enable USB Debugging: Go to Developer Options in settings and enable USB Debugging

2. Connect device and Allow communication

    - Pop up message must appear and enable transfer.
    - Run the following command to verify your device has been detected: `adb devices`

3. In your terminal run

    ```bash
    adb reverse tcp:8081 tcp:8081
    bun mobile android
    ```

If it fails, quit the terminal and run it directly from Android Studio. Once you get the first build running, retry the previous step.

## Development

Once all the setup steps above are completed, you're ready to try running the app locally!

### Environment variables

Note: The app will likely have limited functionality when running it locally with the default environment variables.

Use the environment variables defined in the `.env.defaults.local` file to run the app locally.

You can use the command `bun mobile env:local:download` if you have the 1password CLI to copy that file to your root folder.

### Compile contract ABI types

This is done in bootstrap but good to know about. Before the code will compile you need to generate types for the smart contracts the wallet interacts with. Run `bun g:prepare` at the top level. Re-run this if the ABIs are ever changed.

### Run the app

In the root directory, run `bun install` to install all the necessary npm packages.

Then run `bun mobile pod` to install all the necessary pods. (You may need to updated source repos with `pod repo update` if this fails.)

Finally, run `bun mobile ios` to boot up the iOS Simulator and run the app inside it. The JS bundler (metro) should automatically open in a new terminal window. If it does not, start it manually with `bun start`.

Or you can use one command to run them all one after the other: `bun install && bun pod && bun ios`

You can also run the app from Xcode, which is necessary for any Swift related changes. Xcode will automatically start the metro bundler.

Hopefully you now (after a few minutes) see the Uniswap Wallet running in the iOS Simulator!

### Using Radon IDE (VSCode/Cursor Extension)

[Radon IDE](https://marketplace.visualstudio.com/items?itemName=swmansion.react-native-ide&ssr=false#review-details) is a relatively new VSCode extension build by Software Mansion. TLDR; its tagline is

> A better developer experience for React Native developers

It's not perfect, but it's great to have in the toolbox. One noteworthy feature is the ability to click on any piece of UI and be able to inspect the component hierarchy + jump straight into the relevant code. There's also support for breakpoints in VSCode/Cursor, better logging, instant replay of your session, and the ability to adjust common device settings on the fly.

To get started, you should already be able to build the iOS app (either in XCode or via the cli). Install the extension, open it, and follow the onboarding instructions.

One you have a device configured, it will start to build. If/when successful, you'll see the device simulator/emulator in the sidebar.

In `.vscode/launch.json`, you will see configurations for each platform. This is where you can specify the fingerprint command. The fingerprint is a hash of the build environment, and Radon uses it to determine if the build has changed so that it knows when to re-run the build process (i.e. only on native code changes). See `getFingerprintForRadonIDE.js` for more details. There are more complex implementations of this, but this is a simple first step.

#### Running on a Physical iOS Device

1. Follow all steps listed above.
2. Sign into your `@uniswap.org` Apple ID (`Cmd + ,` -> Accounts tab) + download provisioning profiles
3. Connect your iOS device + follow the on-screen prompts to trust your computer
4. Select the Uniswap target + your connect device, then `Cmd + R` or use the ▶️ button the start the build
5. You may get an error about your device not yet being added to the Uniswap Apple Developer account; if so, click `Register` and restart the build

## Important Libraries and Tools

These are some tools you might want to familiarize yourself with to understand the codebase better and how different aspects of it work.

- [Redux](https://redux.js.org/) and [Redux Toolkit](https://redux-toolkit.js.org/): state management
- [redux-saga](https://redux-saga.js.org/) & [typed-redux-saga](https://github.com/agiledigital/typed-redux-saga): Redux side effect manager -- used for complex/stateful network calls
- [ethers](https://docs.ethers.io/v5/)
- [Tamagui](https://tamagui.dev): UI framework
- [React navigation](https://reactnavigation.org/): routing and navigation with animations and gestures
- [react-i18next](https://react.i18next.com/): i18n

## Migrations

We use `redux-persist` to persist the Redux state between user sessions. Most of this state is shared between the mobile app and the extension. Please review the [Wallet Migrations README](../../packages/wallet/src/state//README.md) for details on how to write migrations when you add or remove anything from the Redux state structure.

## Testing & Performance

- [Build local app files](./docs/build-app-files.md)
- [E2E testing](./docs/e2e-testing.md)
- [Performance monitoring](./docs/perf-monitoring.md)


## Troubleshooting

### Common issues

- `zsh: command not found: [package name]`
  This means whichever package you're trying to run (`[package name]`) wasn’t correctly installed, or your Terminal can’t figure out how to run it. If you just installed it, try quitting terminal and re-opening it. Otherwise try reinstalling the package.

- `Failed to load 'glog' podspec:`
  Resolve this issue by checking the path of Xcode, make sure is inside Applications and with the name `Xcode`
  Once confirm run the following commands:

`sudo xcode-select --switch /Applications/Xcode.app`
`pod install`

- `unable to open file (in target "OneSignalNotificationServiceExtension" in project "Uniswap")`.
  Resolve this issue by navigating to the `ios/` directory and running `pod update`.

- `Build target hermes-engine: Command PhaseScriptExecution failed with a nonzero exit code`
  Node isn't being located correctly during the build phase. Run `which node` and copy the resulting path into `.xcode.env.local`. More context [here](https://github.com/facebook/react-native/issues/42221).

- `CocoaPods could not find compatible versions for pod "hermes-engine"`
  The following commands can help you fix these types of errors:

`cd ios && pod install --repo-update`
`cd ios && pod repo update`
`cd ios && pod update hermes-engine --no-repo-update`

Context: <https://uniswapteam.slack.com/archives/C02GYG8TU12/p1692640189802989?thread_ts=1692635970.952869&cid=C02GYG8TU12>

### Common fixes

If something isn’t working the way it should or you’re getting a weird error when trying to run the app, try the following:

1. Quit the terminal
2. Quit Metro terminal
3. Open Finder and navigate to the `mobile` directory
4. Delete the `node_modules` folder
5. Navigate into the `ios` folder
6. Delete the `Pods` folder
7. Open XCode
8. Go to Product → Clean Build Folder
9. Open your terminal again
10. Navigate to the `mobile` directory in the terminal
11. Run `bun install && bun pod` again
12. Run `bun ios`

### Shell profile setup

Your shell profile file is most likely one of: `.bash_profile`, `.zshrc`, or `.zprofile`, and will be located in `/Users/[username]/`. You can reveal hidden files in Finder by pressing `⌘` + `Shift` + `.`.

If issues with your terminal or shell seem to be the cause of some of your problems, here is an example of what that file may look like in order for your terminal to be able to run the app locally:

```zsh
eval "$(/opt/homebrew/bin/brew shellenv)"

export NVM_DIR="$HOME/.nvm"
[ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && \. "/opt/homebrew/opt/nvm/nvm.sh"  # This loads nvm
[ -s "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm" ] && \. "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm"  # This loads nvm bash_completion

