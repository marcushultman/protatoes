import { assertEquals, assertStringIncludes } from 'https://deno.land/std@0.196.0/testing/asserts.ts';

import { addProto, encode, createRoot } from './api.ts';

const FILE_URL = new URL('../proto/test.proto', import.meta.url);
const SOURCE = Deno.readTextFileSync(FILE_URL);

Deno.test({
  name: 'add_proto_error',
  fn() {
    const root = createRoot('');
    const errors = [];
    try {
      addProto(root, '', '');
    } catch (err) {
      errors.push(err);
    }
    try {
      addProto(root, 'file.proto', 'crap');
    } catch (err) {
      errors.push(err);
    }
    addProto(root, 'file.proto', SOURCE);
    try {
      addProto(root, 'file.proto', SOURCE);
    } catch (err) {
      errors.push(err);
    }

    assertEquals(errors.length, 3);
    assertStringIncludes(errors[0].message, 'Assertion failed: !name.empty()');
    assertStringIncludes(errors[1].message, 'Assertion failed: parse_ok');
    assertStringIncludes(errors[2].message, 'Assertion failed: add_ok');
  },
});

Deno.test({
  name: 'encode_error',
  fn() {
    const root = createRoot('');
    const errors = [];
    addProto(root, 'file.proto', SOURCE);
    
    try {
      encode(root, 'foo.bar.Baz', 'crap');
    } catch (err) {
      errors.push(err);
    }

    assertEquals(errors.length, 1);
    assertStringIncludes(errors[0].message, 'Assertion failed: encode_ok');    
  },
});
