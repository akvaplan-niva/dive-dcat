const crossrefDoiBase = "https://api.crossref.org/works/";

export const crossrefDoiUrl = (doi: string) => new URL(doi, crossrefDoiBase);
