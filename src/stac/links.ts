import { importJson } from "../io.ts";
import type { StacLink } from "./types.ts";

export const findLinkByRel = (needle: string, links: StacLink[]) =>
  links.find(({ rel }) => rel === needle);

export const extractStacFilenameFromResponse = (r: Response) => {
  const segs = r.url.split("/").slice(2).filter((s) =>
    !s.endsWith("product.stac.json")
  );
  return segs.at(-1) + ".json";
};

export const extractRightsUrlMapFromStacDir = async (
  dir: URL,
  { ignore = new Set() }: { ignore: Set<string> },
) => {
  const rightsMap = new Map<string, string>();
  for await (const { name } of Deno.readDir(dir)) {
    const inputFileUrl = new URL(name, dir);
    const stac = await importJson(inputFileUrl);
    const licenseLink = findLinkByRel("license", stac.links);
    if (licenseLink && !ignore.has(licenseLink.href)) {
      rightsMap.set(stac.id, licenseLink.href);
    }
  }
  return rightsMap;
};
