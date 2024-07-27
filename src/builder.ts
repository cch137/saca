export type XElementAlias<T extends HTMLElement> = {
  on<K extends keyof HTMLElementEventMap>(
    type: K,
    listener: (this: T, ev: HTMLElementEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): T;
  on(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): T;
  off<K extends keyof HTMLElementEventMap>(
    type: K,
    listener: (this: T, ev: HTMLElementEventMap[K]) => any,
    options?: boolean | EventListenerOptions
  ): T;
  off(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): T;
};

export type Child = string | number | Node;

export type Children = Child | Child[];

export type Attributes = { [key: string]: string };

export type XElementCallback<T extends XElement = XElement> = (el: T) => any;

export type XElement<T extends keyof HTMLElementTagNameMap | string = string> =
  T extends keyof HTMLElementTagNameMap
    ? HTMLElementTagNameMap[T] & XElementAlias<HTMLElementTagNameMap[T]>
    : HTMLElement & XElementAlias<HTMLElement>;

export default function builder<T extends keyof HTMLElementTagNameMap | string>(
  tagName: T,
  attributes?: Attributes,
  children?: Child | Child[],
  callback?: XElementCallback<XElement<T>>
): XElement<T> {
  const el = document.createElement(tagName) as XElement<T>;

  if (attributes)
    for (const key in attributes) el.setAttribute(key, attributes[key]);
  children = children ?? [];

  if (!Array.isArray(children)) children = [children];
  for (const child of children)
    el.appendChild(
      typeof child === "object" ? child : document.createTextNode(String(child))
    );

  Object.defineProperty(el, "on", {
    value: (e: any, l: any, o?: any) => (el.addEventListener(e, l, o), el),
  });

  Object.defineProperty(el, "off", {
    value: (e: any, l: any, o?: any) => (el.removeEventListener(e, l, o), el),
  });

  if (callback) callback(el);

  return el;
}
