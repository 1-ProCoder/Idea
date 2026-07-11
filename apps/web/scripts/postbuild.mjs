// On Vercel only, copy the Vite build output from `apps/web/dist/` to
// `<repo>/dist/` so that Vercel's `outputDirectory: "dist"` (resolved at the
// repo root, where `vercel.json` lives) can find it.
//
// Why this is needed:
// Vite, when launched via `npm -w @flowfix/web run build`, runs with cwd =
// `apps/web/` and therefore writes its build output to `apps/web/dist/`.
// Vercel resolves `outputDirectory` against the **repo root** (the directory
// containing `vercel.json`), so a bare `dist/` lookup at the repo root misses
// the build output and the deploy fails with
// "No Output Directory named 'dist' found".
//
// Gated by `VERCEL=1` so local `npm -w @flowfix/web run build` is unaffected
// — the `apps/web/dist/` output stays inside `apps/web/` where it belongs.

import { cp, rm, mkdir, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

if (process.env.VERCEL === '1') {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  // __dirname = <repo>/apps/web/scripts
  //   -> src  = __dirname/../dist            = <repo>/apps/web/dist
  //   -> dest = __dirname/../../..           = <repo>
  //   -> dest = <repo>/dist
  const src = join(__dirname, '..', 'dist');
  const dest = join(__dirname, '..', '..', '..', 'dist');

  console.log(`[postbuild] VERCEL=1 detected. Copying ${src} -> ${dest}`);
  await rm(dest, { recursive: true, force: true });
  await mkdir(dest, { recursive: true });
  for (const entry of await readdir(src, { withFileTypes: true })) {
    await cp(join(src, entry.name), join(dest, entry.name), {
      recursive: true,
    });
  }
  const copied = await readdir(dest);
  console.log(`[postbuild] OK: copied ${copied.length} entries to ${dest}`);
}
