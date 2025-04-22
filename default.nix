{ pkgs ? import <nixpkgs> { } }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    python3
    (python3.withPackages (ps: [
      ps.numpy
    ]))
    virtualenv
  ];

  shellHook = ''
    # Create and activate a virtual environment if it doesn't exist
    if [ ! -d ".venv" ]; then
      python3 -m venv .venv
    fi
    source .venv/bin/activate
    echo "Virtual environment activated."
  '';
}