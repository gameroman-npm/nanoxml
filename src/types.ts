interface XmlOptions {
  /**
   * String used for tab, defaults to no tabs (compressed)
   */
  indent?: string | undefined;
  /**
   * Return the result as a `stream` (default false)
   */
  stream?: boolean | undefined;
  /**
   * Add default xml declaration (default false)
   */
  declaration?:
    | boolean
    | {
        encoding?: string | undefined;
        standalone?: string | undefined;
      }
    | undefined;
}

interface XmlAttrs {
  [attr: string]: XmlAtom;
}
interface XmlDescArray {
  [index: number]: { _attr: XmlAttrs } | XmlObject;
}
interface ElementObject {
  push(xmlObject: XmlObject): void;
  close(xmlObject?: XmlObject): void;
}

type XmlAtom = string | number | boolean | null;
type XmlDesc =
  | { _attr: XmlAttrs }
  | { _cdata: string }
  | { _attr: XmlAttrs; _cdata: string }
  | XmlAtom
  | XmlAtom[]
  | XmlDescArray;
type XmlObject = { [tag: string]: ElementObject | XmlDesc } | XmlDesc;

declare function element(...xmlObjects: XmlObject[]): ElementObject;

declare function xml(
  xmlObject: XmlObject | XmlObject[],
  options: { stream: true } & XmlOptions,
): NodeJS.ReadableStream;
declare function xml(
  xmlObject?: XmlObject | XmlObject[],
  options?: boolean | string | XmlOptions,
): string;

export type { XmlObject, ElementObject, XmlOptions };
