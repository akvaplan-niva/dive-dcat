#!/usr/bin/env -S deno run --allow-ffi -NERW
import { fetchDoiMetadata } from "../originals/doi.ts";
import { fetchAndExtractStacRights } from "../originals/rights.ts";

if (import.meta.main) {
  await fetchDoiMetadata();
  await fetchAndExtractStacRights();
}
