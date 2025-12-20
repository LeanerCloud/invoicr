#!/usr/bin/env node
/**
 * Post-install script for Invoicr
 * Downloads the GUI binary from GitHub Releases for the current platform
 */

import { execSync } from 'child_process';
import { createWriteStream, existsSync, mkdirSync, chmodSync, unlinkSync, readFileSync, writeFileSync, rmSync, copyFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import { pipeline } from 'stream/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REPO_OWNER = 'LeanerCloud';
const REPO_NAME = 'invoicr';

// Platform/arch to Tauri artifact mapping
const PLATFORM_MAP = {
  'darwin-arm64': {
    artifactPattern: 'Invoicr_VERSION_aarch64.dmg',
    binaryName: 'Invoicr.app',
    type: 'dmg'
  },
  'darwin-x64': {
    artifactPattern: 'Invoicr_VERSION_x64.dmg',
    binaryName: 'Invoicr.app',
    type: 'dmg'
  },
  'linux-x64': {
    artifactPattern: 'invoicr_VERSION_amd64.AppImage',
    binaryName: 'invoicr.AppImage',
    type: 'appimage'
  },
  'linux-arm64': {
    artifactPattern: 'invoicr_VERSION_arm64.AppImage',
    binaryName: 'invoicr.AppImage',
    type: 'appimage'
  },
  'win32-x64': {
    artifactPattern: 'Invoicr_VERSION_x64-setup.exe',
    binaryName: 'Invoicr-setup.exe',
    type: 'exe'
  },
  'win32-arm64': {
    artifactPattern: 'Invoicr_VERSION_arm64-setup.exe',
    binaryName: 'Invoicr-setup.exe',
    type: 'exe'
  }
};

function getPlatformKey() {
  return `${process.platform}-${process.arch}`;
}

function getBinDir() {
  const binDir = join(__dirname, '..', 'bin', '.gui');
  if (!existsSync(binDir)) {
    mkdirSync(binDir, { recursive: true });
  }
  return binDir;
}

function getPackageVersion() {
  const pkgPath = join(__dirname, '..', 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  return pkg.version;
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const handleResponse = (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        https.get(redirectUrl, handleResponse).on('error', reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: Failed to download`));
        return;
      }

      const file = createWriteStream(destPath);
      pipeline(response, file)
        .then(() => resolve())
        .catch(reject);
    };

    https.get(url, handleResponse).on('error', reject);
  });
}

async function extractDmg(dmgPath, destDir, appName) {
  const mountPoint = `/tmp/invoicr-dmg-${Date.now()}`;

  try {
    // Mount the DMG
    execSync(`hdiutil attach "${dmgPath}" -mountpoint "${mountPoint}" -nobrowse -quiet`, {
      stdio: 'pipe'
    });

    // Find and copy the .app bundle
    const appPath = join(mountPoint, appName);
    const destAppPath = join(destDir, appName);

    if (existsSync(appPath)) {
      // Remove existing app if present
      if (existsSync(destAppPath)) {
        rmSync(destAppPath, { recursive: true, force: true });
      }
      // Copy the app bundle
      execSync(`cp -R "${appPath}" "${destAppPath}"`, { stdio: 'pipe' });
    } else {
      // Try to find any .app in the mount point
      const items = readdirSync(mountPoint);
      const appItem = items.find(item => item.endsWith('.app'));
      if (appItem) {
        const foundAppPath = join(mountPoint, appItem);
        const finalDestPath = join(destDir, appItem);
        if (existsSync(finalDestPath)) {
          rmSync(finalDestPath, { recursive: true, force: true });
        }
        execSync(`cp -R "${foundAppPath}" "${finalDestPath}"`, { stdio: 'pipe' });
      }
    }
  } finally {
    // Unmount the DMG
    try {
      execSync(`hdiutil detach "${mountPoint}" -quiet`, { stdio: 'pipe' });
    } catch {
      // Ignore unmount errors
    }
  }

  // Clean up the DMG file
  if (existsSync(dmgPath)) {
    unlinkSync(dmgPath);
  }
}

async function main() {
  // Skip in CI or if explicitly disabled
  if (process.env.CI || process.env.INVOICR_SKIP_DOWNLOAD) {
    console.log('Invoicr: Skipping GUI binary download (CI or INVOICR_SKIP_DOWNLOAD set)');
    return;
  }

  const platformKey = getPlatformKey();
  const platformConfig = PLATFORM_MAP[platformKey];

  if (!platformConfig) {
    console.log(`Invoicr: Platform ${platformKey} not supported for GUI binary download.`);
    console.log('Invoicr: CLI commands will still work. Download GUI manually from:');
    console.log('         https://github.com/LeanerCloud/invoicr/releases');
    return;
  }

  const binDir = getBinDir();
  const versionFile = join(binDir, '.version');

  try {
    const version = getPackageVersion();

    // Check if already downloaded for this version
    if (existsSync(versionFile)) {
      const existingVersion = readFileSync(versionFile, 'utf8').trim();
      if (existingVersion === version) {
        console.log('Invoicr: GUI binary already installed for this version');
        return;
      }
    }

    const artifactName = platformConfig.artifactPattern.replace('VERSION', version);
    const downloadUrl = `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/download/v${version}/${artifactName}`;
    const downloadPath = join(binDir, artifactName);

    console.log(`Invoicr: Downloading GUI binary for ${platformKey}...`);

    await downloadFile(downloadUrl, downloadPath);

    // Handle different artifact types
    if (platformConfig.type === 'dmg') {
      console.log('Invoicr: Extracting application from DMG...');
      await extractDmg(downloadPath, binDir, platformConfig.binaryName);
    } else if (platformConfig.type === 'appimage') {
      // Rename and make executable
      const finalPath = join(binDir, platformConfig.binaryName);
      if (downloadPath !== finalPath) {
        if (existsSync(finalPath)) unlinkSync(finalPath);
        copyFileSync(downloadPath, finalPath);
        unlinkSync(downloadPath);
      }
      chmodSync(finalPath, '755');
    } else if (platformConfig.type === 'exe') {
      // For Windows, just keep the installer
      const finalPath = join(binDir, platformConfig.binaryName);
      if (downloadPath !== finalPath) {
        if (existsSync(finalPath)) unlinkSync(finalPath);
        copyFileSync(downloadPath, finalPath);
        unlinkSync(downloadPath);
      }
      console.log('Invoicr: Windows installer downloaded. Run `invoicr-gui` to install.');
    }

    // Write version marker
    writeFileSync(versionFile, version);

    console.log('Invoicr: GUI binary installed successfully!');
    console.log('Invoicr: Run `invoicr-gui` to launch the desktop application.');

  } catch (error) {
    // Non-fatal: CLI still works without GUI
    console.log('Invoicr: Could not download GUI binary (this is optional).');
    console.log(`Invoicr: ${error.message}`);
    console.log('Invoicr: CLI commands will still work. Download GUI manually from:');
    console.log('         https://github.com/LeanerCloud/invoicr/releases');
  }
}

main().catch(() => {
  // Silently exit - postinstall should not fail npm install
  process.exit(0);
});
