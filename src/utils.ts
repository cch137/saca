import builder from "./builder";

export const downloadFile = (href: string, download: string) =>
  builder("a", { href, target: "_blank", download }, [], (a) => {
    document.body.appendChild(a);
    a.click();
    a.remove();
  });

// @ts-ignore
function query<K extends keyof HTMLElementTagNameMap>(
  selectors: K,
  element?: Element
): HTMLElementTagNameMap[K] | null;
function query<K extends keyof SVGElementTagNameMap>(
  selectors: K,
  element?: Element
): SVGElementTagNameMap[K] | null;
function query<K extends keyof MathMLElementTagNameMap>(
  selectors: K,
  element?: Element
): MathMLElementTagNameMap[K] | null;
function query<E extends Element = Element>(
  selectors: string,
  element?: Element
): E | null;
function query(selectors: string, element = document) {
  return element.querySelector(selectors);
}

// @ts-ignore
function queryAll<K extends keyof HTMLElementTagNameMap>(
  selectors: K,
  element?: Element
): NodeListOf<HTMLElementTagNameMap[K]>;
function queryAll<K extends keyof SVGElementTagNameMap>(
  selectors: K,
  element?: Element
): NodeListOf<SVGElementTagNameMap[K]>;
function queryAll<K extends keyof MathMLElementTagNameMap>(
  selectors: K,
  element?: Element
): NodeListOf<MathMLElementTagNameMap[K]>;
function queryAll<E extends Element = Element>(
  selectors: string,
  element?: Element
): NodeListOf<E>;
function queryAll(selectors: string, element = document) {
  return element.querySelectorAll(selectors);
}

export { query, queryAll };
