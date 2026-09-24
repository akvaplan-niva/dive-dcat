#!/usr/bin/env -S deno run -NR
import { citationProps, tsvCell } from "../citation.ts";
import { loadDatasets } from "../datasets.ts";
import { ndjson } from "../io.ts";

const usage = "Usage: deno task list [ndjson|tsv]";

if (import.meta.main) {
  const format = Deno.args.find((arg) => arg !== "--") ?? "ndjson";
  if (format !== "ndjson" && format !== "tsv") {
    console.error(usage);
    Deno.exit(1);
  }
  const datasets = await loadDatasets();
  if (format === "ndjson") {
    for (const dataset of datasets) ndjson(dataset);
  } else {
    console.log(citationProps.join("\t"));
    for (const dataset of datasets) {
      console.log(citationProps.map((key) => tsvCell(dataset[key])).join("\t"));
    }
  }
}
