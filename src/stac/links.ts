import type { StacLink } from "./types.ts";

export const findLinkByRel = (needle: string, links: StacLink[]) =>
  links.find(({ rel }) => rel === needle);

export const extractStacFilenameFromResponse = (r: Response) => {
  const segs = r.url.split("/").slice(2).filter((s) =>
    !s.endsWith("product.stac.json")
  );
  return segs.at(-1) + ".json";
};
