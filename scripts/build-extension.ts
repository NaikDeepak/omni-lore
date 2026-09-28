import * as esbuild from 'esbuild';
import * as fs from 'fs';
import * as path from 'path';

const ROOT_DIR = process.cwd();
const EXT_SRC = path.join(ROOT_DIR, 'chrome-extension');
const DIST_DIR = path.join(EXT_SRC, 'dist');

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyFile(src: string, dest: string) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function copyDir(srcDir: string, destDir: string) {
  if (!fs.existsSync(srcDir)) return;
  ensureDir(destDir);
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFile(srcPath, destPath);
    }
  }
}

function bumpExtensionVersion(): string {
  const manifestPath = path.join(EXT_SRC, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const versionParts = (manifest.version || '1.0.0').split('.').map((n: string) => parseInt(n, 10));

  // Auto-increment patch version: 1.0.0 -> 1.0.1 -> 1.0.2
  versionParts[2] = (versionParts[2] || 0) + 1;
  const newVersion = versionParts.join('.');
  manifest.version = newVersion;

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(`🏷️  [OmniLore Reader] Version incremented: v${newVersion}`);
  return newVersion;
}

async function buildExtension() {
  console.log('🔮 [OmniLore Reader] Initiating extension build sequence...');

  // Auto-bump manifest version on each build
  const newVersion = bumpExtensionVersion();

  // 1. Clean and initialize dist directory
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }
  ensureDir(DIST_DIR);

  const sharedBuildOptions: esbuild.BuildOptions = {
    bundle: true,
    platform: 'browser',
    target: ['chrome114'],
    sourcemap: false,
    minify: false, // Keep readable for inspection/debugging
    define: {
      'process.env.NODE_ENV': '"production"'
    }
  };

  try {
    // 2. Build Background Service Worker (ESM)
    console.log('⚡ Compiling Background Service Worker...');
    await esbuild.build({
      ...sharedBuildOptions,
      entryPoints: [path.join(EXT_SRC, 'background', 'service-worker.ts')],
      outfile: path.join(DIST_DIR, 'background', 'service-worker.js'),
      format: 'esm'
    });

    // 3. Build Content Script (IIFE for standalone execution in page world)
    console.log('📜 Compiling Content Detector Script...');
    await esbuild.build({
      ...sharedBuildOptions,
      entryPoints: [path.join(EXT_SRC, 'content', 'content.ts')],
      outfile: path.join(DIST_DIR, 'content', 'content.js'),
      format: 'iife'
    });

    // 4. Build Sidepanel Application (ESM React App)
    console.log('🎮 Compiling Sidepanel HUD (React 19)...');
    await esbuild.build({
      ...sharedBuildOptions,
      entryPoints: [path.join(EXT_SRC, 'sidepanel', 'app.tsx')],
      outfile: path.join(DIST_DIR, 'sidepanel', 'app.js'),
      format: 'esm',
      loader: {
        '.json': 'json',
        '.svg': 'text',
        '.png': 'dataurl'
      }
    });

    // 5. Copy Static Manifest and Assets
    console.log('📦 Copying Manifest, HTML, CSS, and Icons...');
    copyFile(
      path.join(EXT_SRC, 'manifest.json'),
      path.join(DIST_DIR, 'manifest.json')
    );
    copyFile(
      path.join(EXT_SRC, 'sidepanel', 'index.html'),
      path.join(DIST_DIR, 'sidepanel', 'index.html')
    );
    copyFile(
      path.join(EXT_SRC, 'sidepanel', 'sidepanel.css'),
      path.join(DIST_DIR, 'sidepanel', 'sidepanel.css')
    );
    copyDir(
      path.join(EXT_SRC, 'assets', 'icons'),
      path.join(DIST_DIR, 'assets', 'icons')
    );

    console.log(`\n✅ [OmniLore Reader] Extension v${newVersion} built successfully!`);
    console.log(`📁 Unpacked extension directory: ${DIST_DIR}`);
    console.log('👉 To reload in Chrome: Navigate to chrome://extensions and click the 🔄 refresh icon.');

  } catch (err) {
    console.error('❌ Build failed:', err);
    process.exit(1);
  }
}

buildExtension();
