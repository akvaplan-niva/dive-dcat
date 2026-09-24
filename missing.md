# Missing data

No identifier in [data/original](data/original) for:

- SAR wind
- AROME
- IFREMER rain cell polygons
- Raw reflectivity of rain

Nearby text in records that are present:

- `sentinel-1-grd` is Sentinel-1 GRD imagery, not a wind dataset.
- `no.met.adc:90e1c0ba-9dc7-5ffe-9578-28b73967602d` is the ROMS NorKyst800 ocean model. Its description says "atmospheric forcing from Arome2.5km". That is not an AROME record.
- The same NorKyst record has a bounding-box `POLYGON`, not IFREMER rain-cell polygons.
