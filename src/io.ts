import { extension } from "@std/media-types";

export const filenameFromResponseUrl = (r: Response) => {
  const cont = r.headers.get("content-type");
  const suf = cont ? "." + extension(cont) : "";
  const f = r.url.replace("https://", "").replace(/[^a-zA-Z0-9._-]/g, "_");
  return f.endsWith(suf) ? f : f + suf;
};

export const fetchToDir = async (
  src: URL | string,
  dir: URL,
  filenamer: (r: Response) => string,
) => {
  try {
    const r = await fetch(src);
    if (r && r.ok && r.body) {
      const filename = filenamer(r);
      const furl = new URL(filename, dir);
      console.warn(furl.href);
      const f = await Deno.open(furl, {
        write: true,
        create: true,
        truncate: true,
      });
      await r.body.pipeTo(f.writable);
    }
  } catch (e) {
    console.error(e);
  }
};

export const ndjson = (o: unknown) => console.log(JSON.stringify(o));

export const fetchJson = async (url: URL | string) => {
  try {
    const r = await fetch(url);
    if (r.ok) {
      return await r.json();
    }
  } catch (e) {
    console.error(e);
  }
};

export const importJson = async (url: URL | string) => {
  try {
    const href = typeof url === "string" ? url : url.href;
    const mod = await import(href, { with: { type: "json" } });
    return mod.default;
  } catch (e) {
    console.error(e);
  }
};

export const saveJson = async (url: URL, object: unknown) =>
  await Deno.writeTextFile(url, JSON.stringify(object) + "\n");
