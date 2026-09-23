const base = "https://api.datacite.org/dois/";

export const dataciteDoiUrl = (doi: string) => new URL(doi, base);

//https://api.datacite.org/text/x-bibliography/10.48670/moi-00007?style=apa&lang=en-US
