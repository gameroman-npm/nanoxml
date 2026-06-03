import assert from "node:assert/strict";
import { test } from "node:test";

import { xml, element as xmlElement } from "nanoxml";

test("no elements", () => {
  assert.strictEqual(xml(), "");
  assert.strictEqual(xml([]), "");
  assert.strictEqual(xml("test"), "test");
  assert.strictEqual(xml("scotch & whisky"), "scotch &amp; whisky");
  assert.strictEqual(
    xml("bob's escape character"),
    "bob&apos;s escape character",
  );
});

test("simple options", () => {
  assert.strictEqual(xml([{ a: {} }]), "<a/>");
  assert.strictEqual(xml([{ a: null }]), "<a/>");
  assert.strictEqual(xml([{ a: [] }]), "<a></a>");
  assert.strictEqual(xml([{ a: -1 }]), "<a>-1</a>");
  assert.strictEqual(xml([{ a: false }]), "<a>false</a>");
  assert.strictEqual(xml([{ a: "test" }]), "<a>test</a>");
  assert.strictEqual(xml({ a: {} }), "<a/>");
  assert.strictEqual(xml({ a: null }), "<a/>");
  assert.strictEqual(xml({ a: [] }), "<a></a>");
  assert.strictEqual(xml({ a: -1 }), "<a>-1</a>");
  assert.strictEqual(xml({ a: false }), "<a>false</a>");
  assert.strictEqual(xml({ a: "test" }), "<a>test</a>");
  assert.strictEqual(
    xml([{ a: "test" }, { b: 123 }, { c: -0.5 }]),
    "<a>test</a><b>123</b><c>-0.5</c>",
  );
});

test("deeply nested objects", () => {
  assert.strictEqual(
    xml([{ a: [{ b: [{ c: 1 }, { c: 2 }, { c: 3 }] }] }]),
    "<a><b><c>1</c><c>2</c><c>3</c></b></a>",
  );
});

test("indents property", () => {
  assert.strictEqual(
    xml([{ a: [{ b: [{ c: 1 }, { c: 2 }, { c: 3 }] }] }], true),
    "<a>\n    <b>\n        <c>1</c>\n        <c>2</c>\n        <c>3</c>\n    </b>\n</a>",
  );
  assert.strictEqual(
    xml([{ a: [{ b: [{ c: 1 }, { c: 2 }, { c: 3 }] }] }], "  "),
    "<a>\n  <b>\n    <c>1</c>\n    <c>2</c>\n    <c>3</c>\n  </b>\n</a>",
  );
  assert.strictEqual(
    xml([{ a: [{ b: [{ c: 1 }, { c: 2 }, { c: 3 }] }] }], "\t"),
    "<a>\n\t<b>\n\t\t<c>1</c>\n\t\t<c>2</c>\n\t\t<c>3</c>\n\t</b>\n</a>",
  );
  assert.strictEqual(
    xml({ guid: [{ _attr: { premalink: true } }, "content"] }, true),
    '<guid premalink="true">content</guid>',
  );
});

test("supports xml attributes", () => {
  assert.strictEqual(xml([{ b: { _attr: {} } }]), "<b/>");
  assert.strictEqual(
    xml([
      {
        a: {
          _attr: {
            attribute1: "some value",
            attribute2: 12345,
          },
        },
      },
    ]),
    '<a attribute1="some value" attribute2="12345"/>',
  );
  assert.strictEqual(
    xml([
      {
        a: [
          {
            _attr: {
              attribute1: "some value",
              attribute2: 12345,
            },
          },
        ],
      },
    ]),
    '<a attribute1="some value" attribute2="12345"></a>',
  );
  assert.strictEqual(
    xml([
      {
        a: [
          {
            _attr: {
              attribute1: "some value",
              attribute2: 12345,
            },
          },
          "content",
        ],
      },
    ]),
    '<a attribute1="some value" attribute2="12345">content</a>',
  );
});

test("supports cdata", () => {
  assert.strictEqual(
    xml([{ a: { _cdata: "This is some <strong>CDATA</strong>" } }]),
    "<a><![CDATA[This is some <strong>CDATA</strong>]]></a>",
  );
  assert.strictEqual(
    xml([
      {
        a: {
          _attr: { attribute1: "some value", attribute2: 12345 },
          _cdata: "This is some <strong>CDATA</strong>",
        },
      },
    ]),
    '<a attribute1="some value" attribute2="12345"><![CDATA[This is some <strong>CDATA</strong>]]></a>',
  );
  assert.strictEqual(
    xml([
      {
        a: {
          _cdata:
            "This is some <strong>CDATA</strong> with ]]> and then again ]]>",
        },
      },
    ]),
    "<a><![CDATA[This is some <strong>CDATA</strong> with ]]]]><![CDATA[> and then again ]]]]><![CDATA[>]]></a>",
  );
});

test("supports encoding", () => {
  assert.strictEqual(
    xml([
      {
        a: [
          {
            _attr: {
              anglebrackets: "this is <strong>strong</strong>",
              url: "http://google.com?s=opower&y=fun",
            },
          },
          "text",
        ],
      },
    ]),
    '<a anglebrackets="this is &lt;strong&gt;strong&lt;/strong&gt;" url="http://google.com?s=opower&amp;y=fun">text</a>',
  );
});

test("supports stream interface", () => {
  const elem = xmlElement({ _attr: { decade: "80s", locale: "US" } });
  const xmlStream = xml({ toys: elem }, { stream: true });
  const results = [
    '<toys decade="80s" locale="US">',
    "<toy>Transformers</toy>",
    "<toy><name>He-man</name></toy>",
    "<toy>GI Joe</toy>",
    "</toys>",
  ];

  elem.push({ toy: "Transformers" });
  elem.push({ toy: [{ name: "He-man" }] });
  elem.push({ toy: "GI Joe" });
  elem.close();

  xmlStream.on("data", (stanza) => {
    assert.strictEqual(stanza, results.shift());
  });

  return new Promise<void>((resolve, reject) => {
    xmlStream.on("close", () => {
      assert.deepStrictEqual(results, []);
      resolve();
    });
    xmlStream.on("error", reject);
  });
});

test("streams end properly", () => {
  const elem = xmlElement({ _attr: { decade: "80s", locale: "US" } });
  const xmlStream = xml({ toys: elem }, { stream: true });

  let gotData = false;

  elem.push({ toy: "Transformers" });
  elem.push({ toy: "GI Joe" });
  elem.push({ toy: [{ name: "He-man" }] });
  elem.close();

  xmlStream.on("data", (data) => {
    assert.ok(data);
    gotData = true;
  });

  xmlStream.on("end", () => {
    assert.ok(gotData);
  });

  return new Promise<void>((resolve, reject) => {
    xmlStream.on("close", () => {
      assert.ok(gotData);
      resolve();
    });
    xmlStream.on("error", reject);
  });
});

test("xml declaration options", () => {
  assert.strictEqual(
    xml([{ a: "test" }], { declaration: true }),
    '<?xml version="1.0" encoding="UTF-8"?><a>test</a>',
  );
  assert.strictEqual(
    xml([{ a: "test" }], { declaration: { encoding: "foo" } }),
    '<?xml version="1.0" encoding="foo"?><a>test</a>',
  );
  assert.strictEqual(
    xml([{ a: "test" }], { declaration: { standalone: "yes" } }),
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a>test</a>',
  );
  assert.strictEqual(
    xml([{ a: "test" }], { declaration: false }),
    "<a>test</a>",
  );
  assert.strictEqual(
    xml([{ a: "test" }], { declaration: true, indent: "\n" }),
    '<?xml version="1.0" encoding="UTF-8"?>\n<a>test</a>',
  );
  assert.strictEqual(xml([{ a: "test" }], {}), "<a>test</a>");
});
