{ pkgs }: {
  deps = [
    pkgs.nodejs
    pkgs.python3
    pkgs.python3Packages.pip
    pkgs.curl
    pkgs.wget
    pkgs.ollama
  ];
}
