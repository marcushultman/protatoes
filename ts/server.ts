import { Application, Context, Router } from 'https://deno.land/x/oak/mod.ts';
import { decode, encode, encodeResolve } from './apix.ts';

const assertContentType = (ctx: Context, eq: string) => {
  const ct = ctx.request.headers.get('content-type');
  ctx.assert(!ct || ct === eq, 400);
};

const RESOLVE_ENCODERS = new Map<string, (value: string) => Uint8Array>([
  ['base64', (b64) => new Uint8Array([...atob(b64)].map((c) => c.charCodeAt(0)))],
  ['json', (json) => encodeResolve(JSON.parse(json))],
]);

const getResolve = (ctx: Context) => {
  const resolveRaw = ctx.request.headers.get('x-resolve');
  ctx.assert(resolveRaw, 400, `Missing 'x-resolve' header`);
  const resolveType = ctx.request.headers.get('x-resolve-type');
  const decodeResolve = RESOLVE_ENCODERS.get(resolveType ?? 'base64');
  ctx.assert(decodeResolve, 400, `Invalid 'x-resolve-type': '${resolveType}'`);
  return decodeResolve(resolveRaw);
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

const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8000 });
