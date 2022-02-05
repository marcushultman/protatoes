import { assert, assertEquals } from 'https://deno.land/std@0.121.0/testing/asserts.ts';
import { encodeResolve } from './apix.ts';

const BASE_URL = Deno.env.get('PROD') === '1'
  ? 'https://protatoes.deno.dev'
  : 'http://localhost:8000';

const FILE_URL = Deno.env.get('PROD') === '1'
  ? new URL('https://raw.githubusercontent.com/marcushultman/protatoes/main/proto/test.proto')
  : new URL('../proto/test.proto', import.meta.url);

const SOURCE = await fetch(FILE_URL).then((res) => res.text());

Deno.test({
  name: 'local-json',
  async fn() {
    const headers: HeadersInit = {
      'x-resolve': JSON.stringify({ entry: FILE_URL }),
      'x-resolve-type': 'json',
    };
    const resEncode = await fetch(`${BASE_URL}/encode/foo.bar.Baz`, {
      method: 'post',
      headers: { ...headers, 'content-type': 'application/json' },
      body: JSON.stringify({ a: 'foo', b: 'bar' }),
    });
    assert(resEncode.ok);
    const data = await resEncode.arrayBuffer();

    assertEquals(data.byteLength, 10);

    const resDecode = await fetch(`${BASE_URL}/decode/foo.bar.Baz`, {
      method: 'post',
      headers: { ...headers, 'content-type': 'application/protobuf' },
      body: data,
    });
    assert(resDecode.ok);

    assertEquals(await resDecode.json(), { a: 'foo', b: 'bar' });
  },
});

Deno.test({
  name: 'local-proto',
  async fn() {
    const blob = encodeResolve({ entry: FILE_URL.toString() });
    const headers: HeadersInit = {
      'x-resolve': btoa(String.fromCharCode.apply(null, [...blob])),
    };
    const resEncode = await fetch(`${BASE_URL}/encode/foo.bar.Baz`, {
      method: 'post',
      headers: { ...headers, 'content-type': 'application/json' },
      body: JSON.stringify({ a: 'foo', b: 'bar' }),
    });
    assert(resEncode.ok);
    const data = await resEncode.arrayBuffer();

    assertEquals(data.byteLength, 10);

    const resDecode = await fetch(`${BASE_URL}/decode/foo.bar.Baz`, {
      method: 'post',
      headers: { ...headers, 'content-type': 'application/protobuf' },
      body: data,
    });
    assert(resDecode.ok);

    assertEquals(await resDecode.json(), { a: 'foo', b: 'bar' });
  },
});

Deno.test({
  name: 'source',
  async fn() {
    const headers: HeadersInit = {
      'x-resolve': JSON.stringify({ files: [{ name: 'text.proto', source: SOURCE }] }),
      'x-resolve-type': 'json',
    };
    const resEncode = await fetch(`${BASE_URL}/encode/foo.bar.Baz`, {
      method: 'post',
      headers: { ...headers, 'content-type': 'application/json' },
      body: JSON.stringify({ a: 'foo', b: 'bar' }),
    });
    assert(resEncode.ok);
    const data = await resEncode.arrayBuffer();

    assertEquals(data.byteLength, 10);

    const resDecode = await fetch(`${BASE_URL}/decode/foo.bar.Baz`, {
      method: 'post',
      headers: { ...headers, 'content-type': 'application/protobuf' },
      body: data,
    });
    assert(resDecode.ok);

    assertEquals(await resDecode.json(), { a: 'foo', b: 'bar' });
  },
});
Deno.test({
  name: 'web',
  async fn() {
    const headers: HeadersInit = {
      'x-resolve': JSON.stringify({
        entry: 'google/protobuf/any_test.proto',
        includes: ['https://raw.githubusercontent.com/protocolbuffers/protobuf/master/src/'],
      }),
      'x-resolve-type': 'json',
    };
    const resEncode = await fetch(`${BASE_URL}/encode/protobuf_unittest.TestAny`, {
      method: 'post',
      headers: { ...headers, 'content-type': 'application/json' },
      body: JSON.stringify({
        int32Value: 42,
        text: '42',
        anyValue: {
          '@type': 'type.googleapis.com/protobuf_unittest.TestAny',
          int32Value: 43,
          text: '43',
        },
      }),
    });
    assert(resEncode.ok);
    const data = await resEncode.arrayBuffer();

    assertEquals(data.byteLength, 63);

    const resDecode = await fetch(`${BASE_URL}/decode/protobuf_unittest.TestAny`, {
      method: 'post',
      headers: { ...headers, 'content-type': 'application/protobuf' },
      body: data,
    });
    assert(resDecode.ok);

    assertEquals(await resDecode.json(), {
      int32Value: 42,
      text: '42',
      anyValue: {
        '@type': 'type.googleapis.com/protobuf_unittest.TestAny',
        int32Value: 43,
        text: '43',
      },
    });
  },
});
