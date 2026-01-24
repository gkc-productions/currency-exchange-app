#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
LIB_DIR="$ROOT_DIR/.playwright-libs"
TEMP_DIR=$(mktemp -d)
UBUNTU_CODENAME=$(source /etc/os-release && echo "${VERSION_CODENAME:-noble}")
APT_ROOT="$ROOT_DIR/.apt"
APT_LISTS="$APT_ROOT/lists"
APT_CACHE="$APT_ROOT/cache"
APT_STATUS="$APT_ROOT/status"

mkdir -p "$APT_LISTS" "$APT_CACHE"
touch "$APT_STATUS"

APT_OPTS=(
  -o Dir::State::Lists="$APT_LISTS"
  -o Dir::Cache::archives="$APT_CACHE"
  -o Dir::State::status="$APT_STATUS"
  -o Dir::Etc::sourcelist=/etc/apt/sources.list.d/ubuntu.sources
  -o Dir::Etc::sourceparts=-
)

mkdir -p "$LIB_DIR"

packages=(
  libatk1.0-0
  libatk-bridge2.0-0
  libatspi2.0-0
  libxdamage1
  libxfixes3
  libxcomposite1
  libxrandr2
  libxrender1
  libgbm1
  libdrm2
  libgtk-3-0
  libpangocairo-1.0-0
  libpango-1.0-0
  libgdk-pixbuf-2.0-0
  libcups2
  libxkbcommon0
  libx11-xcb1
  libxss1
  libxi6
  libxtst6
  libxshmfence1
  libnss3
  libasound2
  libxext6
  libx11-6
  libglib2.0-0
  libcairo2
  libdbus-1-3
)

cd "$TEMP_DIR"

fetch_deb_from_packages() {
  local pkg="$1"
  node - <<'NODE' "$pkg" "$UBUNTU_CODENAME"
const https = require("https");

const pkg = process.argv[2];
const codename = process.argv[3];
const url = `https://packages.ubuntu.com/${codename}/amd64/${pkg}/download`;

https
  .get(url, (res) => {
    if (res.statusCode !== 200) {
      process.exit(1);
    }
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => {
      const pattern = new RegExp('href=\\"(https?:\\\\/\\\\/[^\\\\"]+\\\\.deb)\\"');
      const match = data.match(pattern);
      if (!match) {
        process.exit(1);
      }
      process.stdout.write(match[1]);
    });
  })
  .on("error", () => process.exit(1));
NODE
}

has_candidate() {
  local pkg="$1"
  local candidate
  candidate=$(apt-cache "${APT_OPTS[@]}" policy "$pkg" 2>/dev/null | awk '/Candidate:/{print $2}')
  if [ -n "$candidate" ] && [ "$candidate" != "(none)" ]; then
    return 0
  fi
  return 1
}

resolve_pkg() {
  local pkg="$1"
  if has_candidate "$pkg"; then
    echo "$pkg"
    return 0
  fi
  if has_candidate "${pkg}t64"; then
    echo "${pkg}t64"
    return 0
  fi
  return 1
}

apt-get "${APT_OPTS[@]}" update >/dev/null

for pkg in "${packages[@]}"; do
  downloaded=""
  resolved_pkg=$(resolve_pkg "$pkg" || true)
  if [ -n "$resolved_pkg" ]; then
    if apt-get "${APT_OPTS[@]}" download "$resolved_pkg" >/dev/null 2>&1; then
      downloaded=$(ls -1 ${resolved_pkg}_*.deb 2>/dev/null | head -n 1 || true)
    else
      mirror_url=$(fetch_deb_from_packages "$resolved_pkg" "$UBUNTU_CODENAME" || true)
      if [ -n "$mirror_url" ]; then
        deb_name="${resolved_pkg}.deb"
        if curl -fsS "$mirror_url" -o "$deb_name"; then
          downloaded="$deb_name"
        fi
      fi
    fi
  fi

  if [ -n "$downloaded" ]; then
    dpkg -x "$downloaded" "$LIB_DIR"
    rm -f "$downloaded"
  fi
done

rm -rf "$TEMP_DIR"

echo "Playwright runtime libs installed to $LIB_DIR"
