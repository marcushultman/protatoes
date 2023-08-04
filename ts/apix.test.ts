import { assertEquals } from 'https://deno.land/std@0.196.0/assert/mod.ts';
import { decode, encode, encodeResolve } from './apix.ts';

const FILE_URL = new URL('../proto/test.proto', import.meta.url);
const SOURCE = Deno.readTextFileSync(FILE_URL);

Deno.test({
  name: 'local',
  async fn() {
    const blob = encodeResolve({
      entries: [FILE_URL.toString()],
    });
    const data = await encode(blob, 'foo.bar.Baz', { a: 'foo', b: 'bar' });
    assertEquals(data.byteLength, 10);
    const decoded = await decode(blob, 'foo.bar.Baz', data);
    assertEquals(decoded, { a: 'foo', b: 'bar' });
  },
});

Deno.test({
  name: 'source',
  async fn() {
    const blob = encodeResolve({
      files: [
        { name: 'test.proto', source: SOURCE },
      ],
    });
    assertEquals(blob.byteLength, 102);
    const data = await encode(blob, 'foo.bar.Baz', { a: 'foo', b: 'bar' });
    assertEquals(data.byteLength, 10);
    const decoded = await decode(blob, 'foo.bar.Baz', data);
    assertEquals(decoded, { a: 'foo', b: 'bar' });
  },
});

Deno.test({
  name: 'web',
  async fn() {
    const blob = encodeResolve({
      entries: ['google/protobuf/any_test.proto'],
      includes: ['https://raw.githubusercontent.com/protocolbuffers/protobuf/master/src/'],
    });
    assertEquals(blob.byteLength, 104);
    const data = await encode(blob, 'protobuf_unittest.TestAny', {
      int32Value: 42,
      text: '42',
      anyValue: {
        '@type': 'type.googleapis.com/protobuf_unittest.TestAny',
        int32Value: 43,
        text: '43',
      },
    });
    assertEquals(data.byteLength, 63);
    const decoded = await decode(blob, 'protobuf_unittest.TestAny', data);
    assertEquals(decoded, {
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
