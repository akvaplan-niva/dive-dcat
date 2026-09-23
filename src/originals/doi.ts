import { crossrefDoiUrl } from "../apis/crossref.ts";
import { dataciteDoiUrl } from "../apis/datacite.ts";
import { canonicalDoiUrl, getDoiLocation } from "../apis/doi.ts";
import { config } from "../config.ts";
import { fetchJson, fetchToDir } from "../io.ts";

export async function* stacOriginals() {
  const dir = config.dirs.originals.stac;
  for await (const { name } of Deno.readDir(dir)) {
    const inputFileUrl = new URL(name, dir);
    const stac = await fetchJson(inputFileUrl);
    yield stac;
  }
}

export async function* stacDois() {
  for await (const stac of stacOriginals()) {
    if ("sci:doi" in stac) {
      yield [stac.id, stac["sci:doi"]];
    }
  }
}

const filenameFromDoiResponse = (r: Response) =>
  (r.url.split("/10.", 2).at(1)?.split("/")?.at(-1) ??
    crypto.randomUUID()) + ".json";

export async function fetchCrossrefDoiMetadataToDir(doi: string, dir: URL) {
  const url = crossrefDoiUrl(doi);
  await fetchToDir(url, dir, filenameFromDoiResponse);
}

export async function fetchDataCiteDoiMetadataToDir(doi: string, dir: URL) {
  const url = dataciteDoiUrl(doi);
  await fetchToDir(url, dir, filenameFromDoiResponse);
}

export async function fetchDoiMetadata() {
  const dois = new Map();
  const locations = new Map();
  for await (const [id, doi] of stacDois()) {
    const reg = await fetchJson(new URL(doi, "https://doi.org/ra/"));
    if (reg && reg[0]) {
      const { RA } = reg[0];
      if (RA) {
        dois.set(id, doi);
        const location = await getDoiLocation(doi);
        locations.set(canonicalDoiUrl(doi).href, location);
      }
      const [prefix] = doi.split("/", 2);
      if (["DataCite", "Crossref"].includes(RA)) {
        const registrar: "datacite" | "crossref" = RA.toLowerCase();
        const registrarDir = config.dirs.originals[registrar];
        const prefixDir = new URL(prefix + "/", registrarDir);
        await Deno.mkdir(prefixDir, { recursive: true });
        if ("datacite" === registrar) {
          await fetchDataCiteDoiMetadataToDir(doi, prefixDir);
        } else if ("crossref" === registrar) {
          await fetchCrossrefDoiMetadataToDir(doi, prefixDir);
        }
      } else {
        console.error(`Unknown DOI registar: ${RA}`);
      }
    }
  }
}

// “Norkyst” version 3: the coastal ocean forecasting system for Norway
// https://doi.org/10.5194/gmd-19-2785-2026
// => https://data.met.no/dataset/1250dfdf-975c-4c5e-85d4-745506402f06
