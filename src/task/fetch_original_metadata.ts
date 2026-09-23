#!/usr/bin/env -S deno run -NRW
import { fetchMetadata } from "../metadata.ts";

if (import.meta.main) {
  await fetchMetadata();
}
