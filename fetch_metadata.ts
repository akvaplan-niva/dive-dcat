import { fetchAndExtractRights, fetchMetadata } from "./src/io.ts";

if (import.meta.main) {
  await fetchMetadata();
  await fetchAndExtractRights();
}
