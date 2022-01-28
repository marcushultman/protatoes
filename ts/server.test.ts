import { assert, assertEquals } from 'https://deno.land/std@0.121.0/testing/asserts.ts';

const BASE_URL = 'http://localhost:8000';

const SOURCE = `
syntax = "proto3";

package foo.bar;

message Baz {
  string a = 1;
  string b = 2;
}
`;

Deno.test({
  name: 'simple',
  async fn() {
    // Add 'foo' namespace (JSON)
    let res = await fetch(`${BASE_URL}/foo`, { method: 'post' });
    assert(res.ok);
    await res.body?.cancel();

    // Add proto
    res = await fetch(`${BASE_URL}/foo/proto/test.proto`, { method: 'post', body: SOURCE });
    assert(res.ok);
    await res.body?.cancel();

    // Encode Baz
    const resEncode = await fetch(`${BASE_URL}/foo/encode/foo.bar.Baz`, {
      method: 'post',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ a: 'foo', b: 'bar' }),
    });
    assert(resEncode.ok);
    const data = await resEncode.arrayBuffer();

    assert(data.byteLength === 10);

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
