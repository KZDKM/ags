{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
    ags.url = "github:aylur/ags";
  };

  outputs = { self, nixpkgs, ags }: let
    system = "x86_64-linux";
    pkgs = nixpkgs.legacyPackages.${system};
  in {
    packages.${system}.default = ags.lib.bundle {
      inherit pkgs;
      src = ./.;
      name = "ags-shell";
      entry = "app.ts";
      gtk4 = false;

      # additional libraries and executables to add to gjs' runtime
      extraPackages = [
        ags.packages.${system}.apps
        ags.packages.${system}.battery
        ags.packages.${system}.bluetooth
        ags.packages.${system}.hyprland
        ags.packages.${system}.tray
        ags.packages.${system}.mpris
        ags.packages.${system}.network
        ags.packages.${system}.notifd
        ags.packages.${system}.wireplumber
      ];
    };
  };
}
