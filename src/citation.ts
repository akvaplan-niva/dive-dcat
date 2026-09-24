/** DataCite citation properties (schema IDs 1–5) plus license. */
export const citationProps = [
  "identifier",
  "creator",
  "title",
  "publisher",
  "publicationYear",
  "license",
] as const;

export type CitationProp = (typeof citationProps)[number];

export type Citation = Record<CitationProp, string>;

/** Bare DOI (`10.xxxx/...`) used to match the same dataset across sources. */
export const doiKey = (value: string) => {
  const match = value.trim().match(/10\.\d+\/\S+/);
  return match ? match[0].replace(/[).,;]+$/, "").toLowerCase() : "";
};

export const tsvCell = (value: string) => value.replaceAll(/[\t\r\n]/g, " ");

const CC_BY = "https://creativecommons.org/licenses/by/4.0/";

/** License as a URL. CC BY points at Creative Commons, never SPDX. */
export const licenseUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const deed = trimmed.match(
    /creativecommons\.org\/licenses\/([a-z-]+)\/(\d+(?:\.\d+)?)/i,
  );
  if (deed) {
    return `https://creativecommons.org/licenses/${deed[1].toLowerCase()}/${
      deed[2]
    }/`;
  }
  const token = trimmed
    .replace(/^https?:\/\/spdx\.org\/licenses\//i, "")
    .replace(/\.html?$/i, "")
    .replaceAll(/\s+/g, "-")
    .toUpperCase();
  if (token === "CC-BY-4.0" || token === "CC-BY") return CC_BY;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return "";
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const stringsOf = (value: unknown) =>
  Array.isArray(value)
    ? value.flatMap((item) => typeof item === "string" ? [item.trim()] : [])
    : [];

const text = (value: unknown) => typeof value === "string" ? value.trim() : "";

const yearOf = (value: unknown) => {
  const raw = typeof value === "number" ? String(value) : text(value);
  return raw.match(/\d{4}/)?.[0] ?? "";
};

/** DataCite REST record (`/dois/{doi}`), or the `attributes` object alone. */
export const citationFromDataciteJson = (
  json: unknown,
): Citation | undefined => {
  if (!isRecord(json)) return;
  const data = isRecord(json.data) ? json.data : json;
  const attr = isRecord(data.attributes) ? data.attributes : data;
  const doi = text(attr.doi);
  if (!doi) return;
  const creators = (Array.isArray(attr.creators) ? attr.creators : [])
    .flatMap((creator) => {
      if (!isRecord(creator)) return [];
      const name = text(creator.name);
      return name ? [name] : [];
    });
  const titles = (Array.isArray(attr.titles) ? attr.titles : []).flatMap(
    (item) => {
      if (!isRecord(item)) return [];
      const title = text(item.title);
      if (!title) return [];
      return [{ title, main: item.titleType == null }];
    },
  );
  const license = (Array.isArray(attr.rightsList) ? attr.rightsList : [])
    .flatMap((item) => {
      if (!isRecord(item)) return [];
      const label = licenseUrl(text(item.rightsUri)) ||
        licenseUrl(text(item.rightsIdentifier)) ||
        licenseUrl(text(item.rights));
      return label ? [label] : [];
    });
  return {
    identifier: doi,
    creator: creators.join("; "),
    title: (titles.find((item) => item.main) ?? titles[0])?.title ?? "",
    publisher: text(attr.publisher),
    publicationYear: yearOf(attr.publicationYear),
    license: [...new Set(license)].join("; "),
  };
};

/** Crossref works record (`/works/{doi}`). */
export const citationFromCrossrefJson = (
  json: unknown,
): Citation | undefined => {
  if (!isRecord(json)) return;
  const message = isRecord(json.message) ? json.message : json;
  const doi = text(message.DOI) || text(message.doi);
  if (!doi) return;
  const creators = (Array.isArray(message.author) ? message.author : [])
    .flatMap((author) => {
      if (!isRecord(author)) return [];
      const family = text(author.family);
      const given = text(author.given);
      const name = text(author.name) ||
        (family && given ? `${family}, ${given}` : family || given);
      return name ? [name] : [];
    });
  const titles = stringsOf(message.title);
  const issued = isRecord(message.issued)
    ? message.issued["date-parts"]
    : undefined;
  const year = Array.isArray(issued) && Array.isArray(issued[0])
    ? issued[0][0]
    : undefined;
  const license = (Array.isArray(message.license) ? message.license : [])
    .flatMap((item) => {
      if (!isRecord(item)) return [];
      const label = licenseUrl(text(item.URL));
      return label ? [label] : [];
    });
  return {
    identifier: doi,
    creator: creators.join("; "),
    title: titles[0] ?? "",
    publisher: text(message.publisher),
    publicationYear: yearOf(year),
    license: [...new Set(license)].join("; "),
  };
};
