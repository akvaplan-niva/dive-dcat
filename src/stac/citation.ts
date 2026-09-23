#!/usr/bin/env -S deno run --allow-read
// extract datacite metadata?
//https://api.datacite.org/text/x-bibliography/10.48670/moi-00007?style=apa&lang=en-US

import { stacOriginals } from "../originals/doi.ts";

export const main = async () => {
  const rightsMap = new Map<string, string>();
  for await (const stac of stacOriginals()) {
    console.warn(stac);
  }
};

if (import.meta.main) {
  main();
}
