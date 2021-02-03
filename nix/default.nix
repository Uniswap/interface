{ sources ? import ./sources.nix, pkgs ? import sources.nixpkgs { } }:

with pkgs;

{
  shell = mkShell {
    nativeBuildInputs = [
      yarn
      nodejs
    ];
    CFLAGS = if stdenv.isDarwin then "-I/usr/include" else "";
    LDFLAGS = if stdenv.isDarwin then
      "-L${darwin.apple_sdk.frameworks.CoreFoundation}/Library/Frameworks:${darwin.apple_sdk.frameworks.CoreServices}/Library/Frameworks"
    else
      "";
  };
}