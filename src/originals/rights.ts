import { config } from "../config.ts";
import { fetchJson, fetchToDir, filenameFromResponseUrl } from "../io.ts";
import { markdownFilesFromPdfsInDir } from "../pdf.ts";
import { findLinkByRel } from "../stac/links.ts";

// Example from https://user.eumetsat.int/catalogue/EO:EUM:DAT:0557
// [Copernicus] => Data and products from Copernicus Sentinel missions operated by EUMETSAT (hereinafter "Sentinel Data") are made available to you in line with the Copernicus data policy as defined in Regulation (EU) No 2021/696 and dedicated Commission Delegated Regulation (EU) No 1159/2013.
// You are expected to consult and familiarise yourself with the Legal Notice on the use of [Copernicus Sentinel Data and Service Information](https://sentinels.copernicus.eu/documents/247904/690755/Sentinel_Data_Legal_Notice)

export const extractRightsUrlMapFromStacDir = async (
  dir: URL,
  { ignore = new Set() }: { ignore: Set<string> },
) => {
  const rightsMap = new Map<string, string>();
  for await (const { name } of Deno.readDir(dir)) {
    //@todo Refactor with stacOriginals
    const inputFileUrl = new URL(name, dir);
    const stac = await fetchJson(inputFileUrl);
    const licenseLink = findLinkByRel("license", stac.links);
    if (licenseLink && !ignore.has(licenseLink.href)) {
      rightsMap.set(stac.id, licenseLink.href);
    }
  }
  return rightsMap;
};

export const fetchAndExtractStacRights = async () => {
  const ignore = new Set(config.ignore.rights);
  const rightsMap = await extractRightsUrlMapFromStacDir(
    config.dirs.originals.stac,
    { ignore },
  );
  await Deno.mkdir(config.dirs.originals.rights, { recursive: true });
  for (const url of new Set(rightsMap.values())) {
    await fetchToDir(
      url,
      config.dirs.originals.rights,
      filenameFromResponseUrl,
    );
  }
  await markdownFilesFromPdfsInDir(config.dirs.originals.rights);
};
