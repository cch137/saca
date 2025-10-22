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

export async function readStream(
  stream?: ReadableStream<Uint8Array> | null
): Promise<Uint8Array> {
  if (!stream) return new Uint8Array();
  const reader = stream.getReader();
  const buffers: Uint8Array[] = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffers.push(value);
  }
  const array = new Uint8Array(
    buffers.reduce((size, arr) => size + arr.length, 0)
  );
  let offset = 0;
  for (const buffer of buffers) {
    array.set(buffer, offset);
    offset += buffer.length;
  }
  return array;
}

export async function readString(
  stream?: ReadableStream<Uint8Array> | null,
  encoding = "utf-8"
): Promise<string> {
  return new TextDecoder(encoding).decode(await readStream(stream));
}

export async function readJSON(stream?: ReadableStream<Uint8Array> | null) {
  try {
    return JSON.parse(await readString(stream));
  } catch {}
  return undefined;
}

export const toReadableStream = (value: Uint8Array) => {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(value);
      controller.close();
    },
  });
};

export type SleepOptions = { signal?: AbortSignal };

export async function sleep(ms: number, options?: SleepOptions): Promise<void>;
export async function sleep(ms: number, { signal }: SleepOptions = {}) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(resolve, ms);

    if (signal) {
      signal.addEventListener(
        "abort",
        (e) => {
          clearTimeout(timeout);
          reject(signal.reason);
        },
        { once: true }
      );
    }
  });
}

export function asyncDelay<T extends (...args: any[]) => Promise<any>>(
  func: T,
  durationMs: number
): T {
  if (!durationMs) return func;
  return (async (...args: Parameters<T>) => {
    const timer = sleep(durationMs, {});
    try {
      const result = await func(...args);
      await timer;
      return result;
    } catch (e) {
      throw e;
    }
  }) as T;
}

export async function fetch2(
  input: string | URL | globalThis.Request,
  init?: RequestInit
) {
  const res = await fetch(input, init);
  const contentType = res.headers.get("content-type");
  if (!contentType) return res;
  const match = contentType.match(/charset=([^;]+)/i);
  if (!match || match[1] === "utf-8") return res;
  res.text = async () =>
    new TextDecoder(match[1]).decode(await readStream(res.body));
  res.json = async () => JSON.parse(await res.text());
  return res;
}

export function tryJSONParse(jsonString?: string | null) {
  if (!jsonString) {
    return undefined;
  }
  try {
    return JSON.parse(jsonString);
  } catch {
    return undefined;
  }
}

export function tryJSONParseGetKey(
  jsonString: string | undefined | null,
  key: string | number | undefined | null
) {
  if (!jsonString || key === undefined || key === null) {
    return undefined;
  }
  return tryJSONParse(jsonString)?.[key];
}

export type FetchAPIOptions = {
  maxTries?: number;
  trySleepMs?: number;
  validateResponse?: (req: Response) => boolean;
};

export const defaultValidateResponse = (res: Response) =>
  res.ok || res.status < 500;

const subdomains = Object.freeze(["vss1", "vss2", "vss3", "vss4"] as const);
let subdomainIndex = Math.floor(Math.random() * subdomains.length);

export function fetchProxy(
  input: string,
  init?: RequestInit,
  proxyInit?: RequestInit,
  options?: FetchAPIOptions
): Promise<Response>;
export async function fetchProxy(
  input: string,
  init?: RequestInit,
  proxyInit: RequestInit = {},
  {
    maxTries = 3,
    trySleepMs = 250,
    validateResponse = defaultValidateResponse,
  }: FetchAPIOptions = {}
) {
  let error: unknown;

  while (maxTries-- > 0) {
    try {
      subdomainIndex = (subdomainIndex + 1) % subdomains.length;
      const subdomain = subdomains[subdomainIndex];
      const res = await fetch2(`https://${subdomain}.cch137.com/api/proxy`, {
        ...proxyInit,
        method: proxyInit.method || "POST",
        headers: { "Content-Type": "application/json", ...proxyInit.headers },
        body: proxyInit.body || JSON.stringify([input, init], void 0, 0),
      });
      if (validateResponse(res)) return res;
      throw tryJSONParse(await res.text());
    } catch (e) {
      error = e;
    }
    await sleep(trySleepMs);
  }

  throw error || new Error("Failed to fetch after maximum attempts");
}
