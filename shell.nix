{ pkgs }:
pkgs.mkShell {
  buildInputs = with pkgs; [
    nodejs-14_x
    (yarn.override { nodejs = nodejs-14_x; })
  ];
}
