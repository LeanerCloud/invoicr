#!/usr/bin/env node
/**
 * CLI wrapper to launch the Invoicr GUI application
 */

import { spawn, execSync } from 'child_process';
import { existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface PlatformConfig {
  binaryName: string;
  launchMethod: 'open' | 'exec' | 'shell' | 'installer';
  systemPaths: string[];
}

const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  'darwin-arm64': {
    binaryName: 'Invoicr.app',
    launchMethod: 'open',
    systemPaths: ['/Applications/Invoicr.app', '~/Applications/Invoicr.app']
  },
  'darwin-x64': {
    binaryName: 'Invoicr.app',
    launchMethod: 'open',
    systemPaths: ['/Applications/Invoicr.app', '~/Applications/Invoicr.app']
  },
  'linux-x64': {
    binaryName: 'invoicr.AppImage',
    launchMethod: 'exec',
    systemPaths: ['/usr/bin/invoicr', '/usr/local/bin/invoicr']
  },
  'linux-arm64': {
    binaryName: 'invoicr.AppImage',
    launchMethod: 'exec',
    systemPaths: ['/usr/bin/invoicr', '/usr/local/bin/invoicr']
  },
  'win32-x64': {
    binaryName: 'Invoicr-setup.exe',
    launchMethod: 'installer',
    systemPaths: [
      join(process.env.LOCALAPPDATA || '', 'Invoicr', 'Invoicr.exe'),
      join(process.env.PROGRAMFILES || 'C:\\Program Files', 'Invoicr', 'Invoicr.exe')
    ]
  },
  'win32-arm64': {
    binaryName: 'Invoicr-setup.exe',
    launchMethod: 'installer',
    systemPaths: [
      join(process.env.LOCALAPPDATA || '', 'Invoicr', 'Invoicr.exe'),
      join(process.env.PROGRAMFILES || 'C:\\Program Files', 'Invoicr', 'Invoicr.exe')
    ]
  }
};

function getGuiBinDir(): string {
  // Look for bin/.gui relative to this compiled file in dist/commands/
  return join(__dirname, '..', '..', 'bin', '.gui');
}

function expandPath(path: string): string {
  if (path.startsWith('~/')) {
    return join(process.env.HOME || '', path.slice(2));
  }
  return path;
}

function findBinary(): { path: string; isInstaller: boolean } | null {
  const platformKey = `${process.platform}-${process.arch}`;
  const config = PLATFORM_CONFIGS[platformKey];

  if (!config) {
    return null;
  }

  // First, check the downloaded binary location
  const binDir = getGuiBinDir();
  const downloadedPath = join(binDir, config.binaryName);

  if (existsSync(downloadedPath)) {
    return {
      path: downloadedPath,
      isInstaller: config.launchMethod === 'installer'
    };
  }

  // For macOS, also check for any .app in the bin dir
  if (process.platform === 'darwin') {
    if (existsSync(binDir)) {
      const items = readdirSync(binDir);
      const appItem = items.find(item => item.endsWith('.app'));
      if (appItem) {
        return { path: join(binDir, appItem), isInstaller: false };
      }
    }
  }

  // Check system paths
  for (const systemPath of config.systemPaths) {
    const expandedPath = expandPath(systemPath);
    if (existsSync(expandedPath)) {
      return { path: expandedPath, isInstaller: false };
    }
  }

  return null;
}

function launchApp(appPath: string): void {
  const platformKey = `${process.platform}-${process.arch}`;
  const config = PLATFORM_CONFIGS[platformKey];

  console.log('Launching Invoicr GUI...');

  switch (config?.launchMethod) {
    case 'open':
      // macOS: use 'open' command for .app bundles
      spawn('open', [appPath], {
        detached: true,
        stdio: 'ignore'
      }).unref();
      break;

    case 'exec':
      // Linux: execute AppImage directly
      spawn(appPath, [], {
        detached: true,
        stdio: 'ignore'
      }).unref();
      break;

    case 'shell':
    case 'installer':
      // Windows: launch the executable
      spawn(appPath, [], {
        detached: true,
        stdio: 'ignore',
        shell: true
      }).unref();
      break;

    default:
      console.error(`Unsupported platform: ${platformKey}`);
      process.exit(1);
  }
}

function runInstaller(installerPath: string): void {
  console.log('Running Invoicr installer...');
  console.log('Please complete the installation wizard.');

  try {
    // Run installer and wait for it to complete
    execSync(`"${installerPath}"`, { stdio: 'inherit' });
    console.log('\nInstallation complete! You can now run invoicr-gui again to launch the app.');
  } catch (error) {
    console.error('Installation was cancelled or failed.');
    process.exit(1);
  }
}

function printHelp(): void {
  console.log(`
Invoicr GUI not found.

To install the GUI:

1. Via npm (recommended):
   npm install -g invoicr

   The GUI binary will be downloaded automatically during installation.
   If download failed, you can manually download from GitHub.

2. Manual download:
   Visit: https://github.com/LeanerCloud/invoicr/releases

   Download the appropriate installer for your platform:
   - macOS: Invoicr_x.x.x_aarch64.dmg (Apple Silicon) or Invoicr_x.x.x_x64.dmg (Intel)
   - Windows: Invoicr_x.x.x_x64-setup.exe or Invoicr_x.x.x_arm64-setup.exe
   - Linux: invoicr_x.x.x_amd64.deb or invoicr_x.x.x_amd64.AppImage

3. Build from source:
   git clone https://github.com/LeanerCloud/invoicr.git
   cd invoicr/gui
   npm install
   npm run tauri:build
`);
}

function main(): void {
  const result = findBinary();

  if (!result) {
    printHelp();
    process.exit(1);
  }

  if (result.isInstaller) {
    // On Windows, if we only have the installer, run it
    console.log('Invoicr is not installed yet.');
    console.log(`Found installer at: ${result.path}`);
    console.log('');
    runInstaller(result.path);
    return;
  }

  launchApp(result.path);
}

main();
