import { config, metadataTypes } from "../config.ts";
import { markdownFilesFromPdfsInDir } from "./pdf.ts";
import {
  extractRightsUrlMapFromStacDir,
  extractStacFilenameFromResponse,
} from "./stac/links.ts";

import { extension } from "@std/media-types";

const filenameFromResponseUrl = (r: Response) => {
  const cont = r.headers.get("content-type");
  const suf = cont ? "." + extension(cont) : "";
  const f = r.url.replace("https://", "").replace(/[^a-zA-Z0-9._-]/g, "_");
  return f.endsWith(suf) ? f : f + suf;
};

const getFilenamer = (type: string) => {
  switch (type) {
    case "stac":
      return extractStacFilenameFromResponse;
    default:
      return filenameFromResponseUrl;
  }
};

export const fetchMetadata = async () => {
  for (const type of metadataTypes) {
    for (const url of config.urls.originals[type]) {
      const filenamer = getFilenamer(type);
      await Deno.mkdir(config.dirs.originals[type], { recursive: true });
      await fetchToDir(url, config.dirs.originals[type], filenamer);
    }
  }
};

export const fetchAndExtractRights = async () => {
  const ignore = new Set(config.ignore.rights);
  const rightsMap = await extractRightsUrlMapFromStacDir(
    config.dirs.originals.stac,
    { ignore },
  );
  await Deno.mkdir(config.dirs.originals.rights, { recursive: true });
  for (const url of new Set(rightsMap.values())) {
    await fetchToDir(
      url,
      config.dirs.originals.rights,
      filenameFromResponseUrl,
    );
  }
  await markdownFilesFromPdfsInDir(config.dirs.originals.rights);
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
