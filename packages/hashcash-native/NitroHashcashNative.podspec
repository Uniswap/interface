require "json"

# Dynamically resolve the nitro_pod_utils path from the workspace root
# (static require_relative doesn't work for workspace packages due to symlinks)
# Pod::Config.instance.installation_root is the ios folder, so we go up to find workspace root
workspace_root = File.expand_path("../../..", Pod::Config.instance.installation_root.to_s)
nitro_utils_path = File.join(workspace_root, "node_modules", "react-native-nitro-modules", "nitro_pod_utils")
require nitro_utils_path

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "NitroHashcashNative"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => min_ios_version_supported, :visionos => 1.0 }
  s.source       = { :git => "https://github.com/Uniswap/universe.git", :tag => "#{s.version}" }

  s.source_files = [
    # Implementation (Swift)
    "ios/**/*.{swift}",
    # Autolinking/Registration (Objective-C++)
    "ios/**/*.{m,mm}",
    # Implementation (C++ objects)
    "cpp/**/*.{hpp,cpp}",
  ]

  load 'nitrogen/generated/ios/NitroHashcashNative+autolinking.rb'
  add_nitrogen_files(s)

  xcconfig = {
    "CLANG_CXX_LANGUAGE_STANDARD" => "c++20",
    "SWIFT_OBJC_INTEROP_MODE" => "objcxx",
    "DEFINES_MODULE" => "YES",
  }

  if has_react_native()
    react_native_version = get_react_native_version()
    if (react_native_version < 80)
      current_header_search_paths = Array(xcconfig["HEADER_SEARCH_PATHS"])
      xcconfig["HEADER_SEARCH_PATHS"] = current_header_search_paths + ["${PODS_ROOT}/RCT-Folly"]
      xcconfig["GCC_PREPROCESSOR_DEFINITIONS"] = "$(inherited) FOLLY_NO_CONFIG FOLLY_CFG_NO_COROUTINES"
      xcconfig["OTHER_CPLUSPLUSFLAGS"] = "$(inherited) -DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1"
    end
  end

  s.pod_target_xcconfig = xcconfig

  s.dependency 'React-jsi'
  s.dependency 'React-callinvoker'
  install_modules_dependencies(s)
end
