import { isElement, isText, parse, type XmlElement } from "@std/xml";
import { crossrefDoiUrl } from "./apis/crossref.ts";
import { dataciteDoiUrl } from "./apis/datacite.ts";
import {
  type Citation,
  citationFromCrossrefJson,
  citationFromDataciteJson,
  doiKey,
  licenseUrl,
} from "./citation.ts";
import { config } from "@root/config.ts";
import { fetchJson } from "./io.ts";

const yearOf = (value: string | undefined) => value?.match(/\d{4}/)?.[0] ?? "";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const text = (value: unknown) => typeof value === "string" ? value.trim() : "";

/** Producer names, or every named provider when roles are absent. */
const providerCreator = (stac: Record<string, unknown>) => {
  const providers = (Array.isArray(stac.providers) ? stac.providers : [])
    .filter(isRecord);
  const named = providers.flatMap((provider) => {
    const name = text(provider.name);
    return name ? [{ name, roles: provider.roles }] : [];
  });
  const producers = named.filter((provider) =>
    Array.isArray(provider.roles) && provider.roles.includes("producer")
  );
  return (producers.length ? producers : named).map((provider) => provider.name)
    .join("; ");
};

const licenseFromStac = (stac: Record<string, unknown>) => {
  const links = (Array.isArray(stac.links) ? stac.links : []).filter(isRecord);
  const licenseLink = links.find((link) => link.rel === "license");
  return licenseUrl(text(licenseLink?.href)) || licenseUrl(text(stac.license));
};

/** STAC carries title, sometimes a DOI and `published`. Creator is filled later. */
const citationFromStac = (
  stac: Record<string, unknown>,
): { citation: Citation; creatorFallback: string } => {
  const doi = typeof stac["sci:doi"] === "string" ? stac["sci:doi"].trim() : "";
  const id = typeof stac.id === "string" ? stac.id.trim() : "";
  return {
    creatorFallback: providerCreator(stac),
    citation: {
      identifier: doi || id,
      creator: "",
      title: typeof stac.title === "string" ? stac.title.trim() : "",
      publisher: "",
      publicationYear: yearOf(
        typeof stac.published === "string" ? stac.published : undefined,
      ),
      license: licenseFromStac(stac),
    },
  };
};

const children = (el: XmlElement, local: string) =>
  el.children.filter(isElement).filter((child) => child.name.local === local);

const attr = (el: XmlElement, local: string) => {
  for (const [key, value] of Object.entries(el.attributes)) {
    if (key.slice(key.lastIndexOf(":") + 1) === local) return value;
  }
};

const textContent = (el: XmlElement) =>
  el.children.filter(isText).map((node) => node.text).join("").replaceAll(
    /\s+/g,
    " ",
  ).trim();

/** Name on this node, or on the agent/person it wraps — not nested affiliations. */
const agentNames = (el: XmlElement) => {
  const direct = children(el, "name").map(textContent).filter(Boolean);
  if (direct.length) return direct;
  return el.children.filter(isElement).flatMap((child) =>
    children(child, "name").map(textContent).filter(Boolean)
  );
};

const licensesUnder = (el: XmlElement): XmlElement[] => {
  const found: XmlElement[] = [];
  const visit = (node: XmlElement) => {
    for (const child of node.children.filter(isElement)) {
      if (isDcatDataset(child)) continue;
      if (child.name.local === "license") found.push(child);
      else visit(child);
    }
  };
  visit(el);
  return found;
};

const isDcatDataset = (el: XmlElement) => {
  if (el.name.local === "Dataset") return true;
  if (el.name.local !== "Description") return false;
  return children(el, "type").some((type) =>
    (attr(type, "resource") ?? "").includes("dcat#Dataset")
  );
};

const citationFromDcatElement = (el: XmlElement): Citation => {
  const titles = children(el, "title").map((title) => ({
    lang: attr(title, "lang"),
    text: textContent(title),
  })).filter((title) => title.text);
  const issued = children(el, "issued").map(textContent).filter(Boolean);
  const rawId = children(el, "identifier").map(textContent).find(Boolean) ??
    attr(el, "about") ?? "";
  const licenses = licensesUnder(el).flatMap((license) => {
    const named = agentNames(license);
    if (named.length) return named;
    const resource = attr(license, "resource") ?? attr(license, "about") ?? "";
    const documents = children(license, "LicenseDocument").flatMap((doc) => {
      const about = attr(doc, "about");
      return about ? [about] : [];
    });
    return [resource, ...documents].filter(Boolean);
  }).map(licenseUrl).filter(Boolean);
  return {
    identifier: rawId.trim(),
    creator: children(el, "creator").flatMap(agentNames).join("; "),
    title: (titles.find((title) => title.lang === "en") ?? titles[0])?.text ??
      "",
    publisher: children(el, "publisher").flatMap(agentNames).join("; "),
    publicationYear: issued.find((value) => /^\d{4}$/.test(value)) ??
      issued.map((value) => value.slice(0, 4)).find((value) =>
        /^\d{4}$/.test(value)
      ) ?? "",
    license: [...new Set(licenses)].join("; "),
  };
};

const citationsFromDcatXml = (xml: string): Citation[] => {
  const doc = parse(xml, { ignoreWhitespace: true, ignoreComments: true });
  const found: Citation[] = [];
  const visit = (el: XmlElement) => {
    if (isDcatDataset(el)) {
      found.push(citationFromDcatElement(el));
      return;
    }
    for (const child of el.children) {
      if (isElement(child)) visit(child);
    }
  };
  visit(doc.root);
  return found;
};

const filenames = async (dir: URL, suffix: string) => {
  const names: string[] = [];
  for await (const entry of Deno.readDir(dir)) {
    if (entry.isFile && entry.name.endsWith(suffix)) names.push(entry.name);
  }
  names.sort();
  return names;
};

const readJson = async (url: URL) =>
  JSON.parse(await Deno.readTextFile(url)) as unknown;

async function* jsonFiles(dir: URL): AsyncGenerator<URL> {
  let entries;
  try {
    entries = Deno.readDir(dir);
    for await (const entry of entries) {
      const url = new URL(
        entry.isDirectory ? `${entry.name}/` : entry.name,
        dir,
      );
      if (entry.isDirectory) yield* jsonFiles(url);
      else if (entry.isFile && entry.name.endsWith(".json")) yield url;
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return;
    throw error;
  }
}

const indexDoiCitations = async (
  dir: URL,
  parseRecord: (json: unknown) => Citation | undefined,
  into: Map<string, Citation>,
) => {
  for await (const url of jsonFiles(dir)) {
    const citation = parseRecord(await readJson(url));
    const key = citation ? doiKey(citation.identifier) : "";
    if (key && citation) into.set(key, citation);
  }
};

const lookupDoiCitation = async (identifier: string) => {
  const key = doiKey(identifier);
  if (!key) return;
  const reg = await fetchJson(new URL(key, "https://doi.org/ra/"));
  const ra = Array.isArray(reg) && isRecord(reg[0]) ? text(reg[0].RA) : "";
  if (/crossref/i.test(ra)) {
    return citationFromCrossrefJson(await fetchJson(crossrefDoiUrl(key)));
  }
  const datacite = citationFromDataciteJson(
    await fetchJson(dataciteDoiUrl(key)),
  );
  if (datacite?.creator) return datacite;
  return citationFromCrossrefJson(await fetchJson(crossrefDoiUrl(key))) ??
    datacite;
};

const fillEmpty = (row: Citation, found: Citation | undefined) => {
  if (!found) return;
  if (!row.creator && found.creator) row.creator = found.creator;
  if (!row.publisher && found.publisher) row.publisher = found.publisher;
  if (!row.publicationYear && found.publicationYear) {
    row.publicationYear = found.publicationYear;
  }
  if (!row.license && found.license) row.license = found.license;
  if (!row.title && found.title) row.title = found.title;
};

export const loadDatasets = async (): Promise<Citation[]> => {
  const datasets: Citation[] = [];
  const creatorFallback = new Map<string, string>();
  for (const name of await filenames(config.dirs.originals.stac, ".json")) {
    const json = await readJson(new URL(name, config.dirs.originals.stac));
    if (json && typeof json === "object") {
      const { citation, creatorFallback: fallback } = citationFromStac(
        json as Record<string, unknown>,
      );
      if (fallback) creatorFallback.set(citation.identifier, fallback);
      datasets.push(citation);
    }
  }
  for (const name of await filenames(config.dirs.originals.dcat, ".xml")) {
    const xml = await Deno.readTextFile(
      new URL(name, config.dirs.originals.dcat),
    );
    datasets.push(...citationsFromDcatXml(xml));
  }

  const byDoi = new Map<string, Citation>();
  await indexDoiCitations(
    config.dirs.originals.crossref,
    citationFromCrossrefJson,
    byDoi,
  );
  await indexDoiCitations(
    config.dirs.originals.datacite,
    citationFromDataciteJson,
    byDoi,
  );

  const rows = datasets.map((dataset) => {
    const key = doiKey(dataset.identifier);
    const registered = key ? byDoi.get(key) : undefined;
    if (!registered) return dataset;
    return {
      identifier: registered.identifier || dataset.identifier,
      creator: registered.creator || dataset.creator,
      title: registered.title || dataset.title,
      publisher: registered.publisher || dataset.publisher,
      publicationYear: registered.publicationYear || dataset.publicationYear,
      license: registered.license || dataset.license,
    };
  });
  await Promise.all(rows.map(async (row) => {
    if (row.creator || !doiKey(row.identifier)) return;
    fillEmpty(row, await lookupDoiCitation(row.identifier));
  }));
  for (const row of rows) {
    if (!row.creator) {
      row.creator = creatorFallback.get(row.identifier) ?? "";
    }
  }
  rows.sort((a, b) =>
    a.identifier.localeCompare(b.identifier) || a.title.localeCompare(b.title)
  );
  return rows;
};
