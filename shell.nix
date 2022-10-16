with import <nixpkgs> { };

pkgs.mkShell {
  buildInputs = [
    nodejs-16_x
    yarn
  ];
}