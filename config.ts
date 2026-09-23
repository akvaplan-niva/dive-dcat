export const metadataTypes = new Set(["stac", "dcat"] as const);

const originalDirs = new Set([...metadataTypes, "rights"] as const);
type OriginalDirType = typeof originalDirs extends Set<infer T> ? T : never;

const externalStacUrls = [
  "https://stac.dataspace.copernicus.eu/v1/collections/sentinel-1-grd",
  "https://stac.dataspace.copernicus.eu/v1/collections/sentinel-2-l2a",
  "https://stac.dataspace.copernicus.eu/v1/collections/sentinel-3-olci-2-wrr-ntc",
  "https://ewds.climate.copernicus.eu/api/catalogue/v1/collections/cems-glofas-historical",
  "https://stac.marine.copernicus.eu/metadata/GLOBAL_MULTIYEAR_PHY_001_030/product.stac.json",
  "https://stac.marine.copernicus.eu/metadata/GLOBAL_MULTIYEAR_BGC_001_029/product.stac.json",
  "https://stac.marine.copernicus.eu/metadata/ARCTIC_MULTIYEAR_PHY_002_003/product.stac.json",
  "https://cds.climate.copernicus.eu/api/catalogue/v1/collections/reanalysis-era5-land-monthly-means",
  "https://cds.climate.copernicus.eu/api/catalogue/v1/collections/reanalysis-era5-single-levels",
];
// const era5SingleLevel =
//   "https://cds.climate.copernicus.eu/api/catalogue/v1/collections/reanalysis-era5-single-levels-timeseries";
// const era5complete =
//   "https://cds.climate.copernicus.eu/api/catalogue/v1/collections/reanalysis-era5-complete";

const externalDcatUrls = [
  "https://adc.met.no/dataset/90e1c0ba-9dc7-5ffe-9578-28b73967602d?export_type=dcatap",
];

const externalUrls = {
  stac: externalStacUrls,
  dcat: externalDcatUrls,
  rights: [
    "https://sentinels.copernicus.eu/documents/247904/690755/Sentinel_Data_Legal_Notice",
  ],
} as const satisfies Record<OriginalDirType, string[]>;

const originals = {
  dcat: new URL("./data/original/dcat/", import.meta.url),
  stac: new URL("./data/original/stac/", import.meta.url),
  rights: new URL("./data/original/rights/", import.meta.url),
} as const satisfies Record<OriginalDirType, URL>;

export const config = {
  dirs: {
    originals,
  },
  urls: {
    originals: externalUrls,
  },
  ignore: {
    rights: [
      "https://sentinel.esa.int/documents/247904/690755/Sentinel_Data_Legal_Notice",
    ],
  },
};
