import { build, stop } from 'https://deno.land/x/esbuild@v0.18.17/mod.js'

await build({
  entryPoints: [
    new URL('ts/api.ts', import.meta.url).pathname,
    new URL('ts/apix.ts', import.meta.url).pathname,
  ],
  outdir: new URL('dist', import.meta.url).pathname,
  bundle: true,
  minify: true,
  format: 'esm',
  external: ['module', './bin/api.js'],
});
stop();
