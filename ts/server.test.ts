import { assert, assertEquals } from 'https://deno.land/std@0.121.0/testing/asserts.ts';

const BASE_URL = 'http://localhost:8000';

const WEB_URL = new URL(
  'https://raw.githubusercontent.com/marcushultman/protatoes/main/proto/test.proto',
);
const FILE_URL = new URL('../proto/test.proto', import.meta.url);
const SOURCE = Deno.readTextFileSync(FILE_URL);

Deno.test({
  name: 'source',
  async fn() {
    // Add 'foo' namespace (JSON)
    let res = await fetch(`${BASE_URL}/foo`, { method: 'post' });
    assert(res.ok);
    await res.body?.cancel();

    // Add proto
    res = await fetch(`${BASE_URL}/foo/proto/test.proto`, { method: 'post', body: SOURCE });
    assert(res.ok);
    const { syntax, name, package: pkg } = await res.json();
    assertEquals(syntax, 'proto3');
    assertEquals(name, 'test.proto');
    assertEquals(pkg, 'foo.bar');

    // Encode Baz
    const resEncode = await fetch(`${BASE_URL}/foo/encode/foo.bar.Baz`, {
      method: 'post',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ a: 'foo', b: 'bar' }),
    });
    assert(resEncode.ok);
    const data = await resEncode.arrayBuffer();

    assertEquals(data.byteLength, 10);

    // Decode Baz
    const resDecode = await fetch(`${BASE_URL}/foo/decode/foo.bar.Baz`, {
      method: 'post',
      headers: { 'content-type': 'application/protobuf' },
      body: data,
    });
    assert(resDecode.ok);

    assertEquals(await resDecode.json(), { a: 'foo', b: 'bar' });
  },
});

Deno.test({
  name: 'local',
  async fn() {
    // Add 'bar' namespace (JSON)
    let res = await fetch(`${BASE_URL}/bar`, { method: 'post' });
    assert(res.ok);
    await res.body?.cancel();

    // Add proto
    res = await fetch(`${BASE_URL}/bar/proto/test.proto`, {
      method: 'post',
      body: FILE_URL.toString(),
    });
    assert(res.ok);
    const { descriptors } = await res.json();
    assertEquals(descriptors.length, 1);
    const { syntax, name, package: pkg } = descriptors[0];
    assertEquals(syntax, 'proto3');
    assertEquals(name, 'test.proto');
    assertEquals(pkg, 'foo.bar');

    // Encode Baz
    const resEncode = await fetch(`${BASE_URL}/bar/encode/foo.bar.Baz`, {
      method: 'post',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ a: 'foo', b: 'bar' }),
    });
    assert(resEncode.ok);
    const data = await resEncode.arrayBuffer();

    assertEquals(data.byteLength, 10);

    // Decode Baz
    const resDecode = await fetch(`${BASE_URL}/bar/decode/foo.bar.Baz`, {
      method: 'post',
      headers: { 'content-type': 'application/protobuf' },
      body: data,
    });
    assert(resDecode.ok);

    assertEquals(await resDecode.json(), { a: 'foo', b: 'bar' });
  },
});

Deno.test({
  name: 'web',
  async fn() {
    // Add 'bar' namespace (JSON)
    let res = await fetch(`${BASE_URL}/baz`, { method: 'post' });
    assert(res.ok);
    await res.body?.cancel();

    // Add proto
    res = await fetch(`${BASE_URL}/baz/proto/test.proto`, {
      method: 'post',
      body: WEB_URL.toString(),
    });
    assert(res.ok);
    const { descriptors } = await res.json();
    assertEquals(descriptors.length, 1);
    const { syntax, name, package: pkg } = descriptors[0];
    assertEquals(syntax, 'proto3');
    assertEquals(name, 'test.proto');
    assertEquals(pkg, 'foo.bar');

    // Encode Baz
    const resEncode = await fetch(`${BASE_URL}/baz/encode/foo.bar.Baz`, {
      method: 'post',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ a: 'foo', b: 'bar' }),
    });
    assert(resEncode.ok);
    const data = await resEncode.arrayBuffer();

    assertEquals(data.byteLength, 10);

    // Decode Baz
    const resDecode = await fetch(`${BASE_URL}/baz/decode/foo.bar.Baz`, {
      method: 'post',
      headers: { 'content-type': 'application/protobuf' },
      body: data,
    });
    assert(resDecode.ok);

    assertEquals(await resDecode.json(), { a: 'foo', b: 'bar' });
  },
});
