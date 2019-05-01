let
  # https://vaibhavsagar.com/blog/2018/05/27/quick-easy-nixpkgs-pinning/
  inherit (import <nixpkgs> {}) fetchgit;

  channel = fetchgit {
    url = "https://github.com/NixOS/nixpkgs-channels.git";
    rev = "aeb464dfd3724e013eb5c6a1bc82b1101d1306ce";
    sha256 = "1yrg56h6b8kd3sdiprz6kfqspl7g2nlkzk22p68kydryh5wa0chf";
  };

  pkgs = import channel {};
in
with pkgs;
stdenv.mkDerivation rec {

  name = "uniswap-shell";

  buildInputs = [
   pkgs.nodejs-11_x
   pkgs.python27
   pkgs.udev
   pkgs.yarn
  ];
}
