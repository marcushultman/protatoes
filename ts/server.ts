import {
  Application,
  Context,
  ListenOptions,
  Router,
} from 'https://deno.land/x/oak@v12.6.0/mod.ts';
import { decode, encode } from './apix.ts';
import { getParser } from './util.ts';

const assertContentType = (ctx: Context, eq: string) => {
  const ct = ctx.request.headers.get('content-type');
  ctx.assert(!ct || ct === eq, 400);
};

const getResolve = (ctx: Context) => {
  const resolveRaw = ctx.request.headers.get('x-resolve');
  ctx.assert(resolveRaw, 400, `Missing 'x-resolve' header`);
  const format = ctx.request.headers.get('x-resolve-type') ?? 'b64';
  const parseResolve = getParser(format);
  ctx.assert(parseResolve, 400, `Invalid 'x-resolve-type': '${format}'`);
  return parseResolve(resolveRaw);
};

const router = new Router();
router
  .post('/encode/:type', async (ctx) => {
    assertContentType(ctx, 'application/json');
    const { type } = ctx.params;
    const blob = getResolve(ctx);
    const bytes = await encode(blob, type, await ctx.request.body({ type: 'json' }).value);
    console.log(`Encoding ${type} (${bytes.byteLength} bytes)`);
    ctx.response.body = bytes;
  })
  .post('/decode/:type', async (ctx) => {
    assertContentType(ctx, 'application/protobuf');
    const { type } = ctx.params;
    const blob = getResolve(ctx);
    const bytes = await ctx.request.body({ type: 'bytes' }).value;
    console.log(`Decoding ${type} (${bytes.byteLength} bytes)`);
    ctx.response.body = await decode(blob, type, bytes);
  });

export function start(opts: ListenOptions = {}) {
  const app = new Application();
  app.use(router.routes());
  app.use(router.allowedMethods());
  app.listen(opts);
  return app;
}

if (import.meta.main) {
  await start();
}
