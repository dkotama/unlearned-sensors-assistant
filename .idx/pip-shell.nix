{ pkgs ? import <nixpkgs> {} }:
(pkgs.buildFHSUserEnv {
  name = "pipzone";
  targetPkgs = pkgs: (with pkgs; [
    python311
    python311Packages.pip
    python311Packages.virtualenv
    gcc
    gfortran
    openblas
    lapack
    zlib
    libstdcxx5
  ]);
  runScript = "bash";
}).env