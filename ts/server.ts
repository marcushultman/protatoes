import { Application, Context, Router } from 'https://deno.land/x/oak/mod.ts';
import { decode, encode } from './apix.ts';
import { getEncoder } from './util.ts';

const assertContentType = (ctx: Context, eq: string) => {
  const ct = ctx.request.headers.get('content-type');
  ctx.assert(!ct || ct === eq, 400);
};

const getResolve = (ctx: Context) => {
  const resolveRaw = ctx.request.headers.get('x-resolve');
  ctx.assert(resolveRaw, 400, `Missing 'x-resolve' header`);
  const resolveType = ctx.request.headers.get('x-resolve-type') ?? 'b64';
  const resolveEncoder = getEncoder(resolveType);
  ctx.assert(resolveEncoder, 400, `Invalid 'x-resolve-type': '${resolveType}'`);
  return resolveEncoder(resolveRaw);
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
