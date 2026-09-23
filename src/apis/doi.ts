const base = "https://doi.org/";

export const canonicalDoiUrl = (doi: URL | string) => {
  if (typeof doi === "string" && doi.startsWith("10.")) {
    return new URL(doi, base);
  }
  if (URL.canParse(doi)) {
    const { pathname } = new URL(doi);
    return new URL(pathname, base);
  }
  throw `Unparsable DOI: ${doi}`;
};

export const getDoiLocation = async (doi: URL | string) => {
  const r = await fetch(canonicalDoiUrl(doi), {
    method: "HEAD",
    redirect: "manual",
  });
  if (r && r.status > 300 && r.status < 400) {
    return r.headers.get("location");
  }
};

// const reg = await fetchJson(new URL(doi, "https://doi.org/ra/"));
// if (reg && reg[0]) {
//   const { RA } = reg[0];
//   if (RA) {
