import { config } from "./config.ts";
import { fetchToDir, filenameFromResponseUrl } from "./io.ts";
//import { fetchDoiMetadata } from "./originals/doi.ts";
import { extractStacFilenameFromResponse } from "./stac/links.ts";

const getFilenamer = (type: string) => {
  switch (type) {
    case "stac":
      return extractStacFilenameFromResponse;
    default:
      return filenameFromResponseUrl;
  }
};

export const fetchMetadata = async () => {
  for (const type of ["dcat", "stac"] as const) {
    for (const url of config.urls.originals[type]) {
      const filenamer = getFilenamer(type);
      await Deno.mkdir(config.dirs.originals[type], { recursive: true });
      await fetchToDir(url, config.dirs.originals[type], filenamer);
    }
  }
};
