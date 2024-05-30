/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      '$0': 'jest',
      config: 'e2e/jest.config.js'
    },
    jest: {
      setupTimeout: 300000
    }
  },
  apps: {
    'ios.debug': {
      type: "ios.app",
      binaryPath: "ios/build/Build/Products/Debug-iphonesimulator/Uniswap.app",
      build: "RN_SRC_EXT=e2e.js,e2e.ts xcodebuild -workspace ios/Uniswap.xcworkspace -scheme Uniswap -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build -UseModernBuildSystem=YES -arch x86_64"
    },
    'ios.release': {
      type: 'ios.app',
      binaryPath: "ios/build/Build/Products/Dev-iphonesimulator/Uniswap.app",
      build: "RN_SRC_EXT=e2e.js,e2e.ts xcodebuild -workspace ios/Uniswap.xcworkspace -scheme Uniswap -configuration Dev -sdk iphonesimulator -derivedDataPath ios/build -UseModernBuildSystem=YES -arch x86_64"
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/dev/debug/app-dev-debug.apk',
      testBinaryPath: "android/app/build/outputs/apk/androidTest/dev/debug/app-dev-debug-androidTest.apk",
      build: 'cd android && ./gradlew assembleDevDebug assembleAndroidTest -DtestBuildType=debug',
      reversePorts: [
        8081
      ]
    },
    'android.release': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/dev/release/app-dev-release.apk',
      testBinaryPath: "android/app/build/outputs/apk/androidTest/dev/release/app-dev-release-androidTest.apk",
      build: 'cd android && ./gradlew assembleDevRelease assembleAndroidTest -DtestBuildType=release'
    }
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: "iPhone 15"
      }
    },
    attached: {
      type: 'android.attached',
      device: {
        adbName: '.*'
      }
    },
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_6_API_34'
      }
    }
  },
  
  configurations: {
    "ios.sim.debug": {
      device: "simulator",
      app: "ios.debug"
    },
    "ios.sim.release": {
      device: "simulator",
      app: "ios.release"
    },
    "android.emu.debug": {
      device: "emulator",
      app: "android.debug"
    },
    "android.emu.release": {
      device: "emulator",
      app: "android.release"
    }
  }
};
