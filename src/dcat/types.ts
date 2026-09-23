export interface DcatDataset {
  "@id"?: string;
  "@type"?: "dcat:Dataset" | string | string[];

  "dcterms:title"?: LangString | string;
  "dcterms:description"?: LangString | string | (LangString | string)[];
  "dcterms:identifier"?: string;
  "dcterms:modified"?: TypedValue;
  "dcterms:subject"?: Ref;
  "dcterms:accessRights"?: Ref | RightsStatement;
  "dcterms:creator"?: Ref | Agent;
  "dcterms:publisher"?: Ref | Agent;
  "dcterms:spatial"?: Ref | Location;
  "dcterms:temporal"?: Ref | PeriodOfTime;
  "dcterms:license"?: Ref | LicenseDocument;

  "dcat:keyword"?: string | string[];
  "dcat:distribution"?: Ref | Distribution | (Ref | Distribution)[];
  "dcat:landingPage"?: Ref | Document;

  "foaf:page"?: Ref | Document;
  "prov:wasGeneratedBy"?: Ref | Activity;
}

export interface Distribution {
  "@id"?: string;
  "@type"?: "dcat:Distribution" | string;

  "dcterms:description"?: string;
  "dcterms:license"?: Ref | LicenseDocument;
  "dcterms:accessRights"?: Ref | RightsStatement;

  "dcat:accessURL"?: Ref | string;
  "dcat:accessService"?: Ref | DataService;
  "adms:status"?: Ref | Concept;
}

export interface DataService {
  "@id"?: string;
  "@type"?: "dcat:DataService" | string;

  "dcterms:title"?: string;
  "dcterms:conformsTo"?: Ref | Standard;

  "dcat:endpointURL"?: Ref | string;
  "dcat:endpointDescription"?: Ref | string;
}

export interface Agent {
  "@id"?: string;
  "@type"?: "foaf:Agent" | string;
  "foaf:name"?: string;
}

export interface Location {
  "@id"?: string;
  "@type"?: "dcterms:Location" | string;
  "dcat:bbox"?: TypedValue; // WKT literal
}

export interface PeriodOfTime {
  "@id"?: string;
  "@type"?: "dcterms:PeriodOfTime" | string;
  "dcat:startDate"?: TypedValue;
}

export interface RightsStatement {
  "@id"?: string;
  "@type"?: "dcterms:RightsStatement" | string;
  "rdfs:label"?: string;
}

export interface LicenseDocument {
  "@id"?: string;
  "@type"?: "dcterms:LicenseDocument" | string;
  "foaf:name"?: string;
}

export interface Concept {
  "@id"?: string;
  "@type"?: "skos:Concept" | string;
  "skos:prefLabel"?: string;
  "skos:inScheme"?: Ref;
}

export interface Standard {
  "@id"?: string;
  "@type"?: "dcterms:Standard" | string;
}

export interface Document {
  "@id"?: string;
  "@type"?: "foaf:Document" | string;
  "dcterms:description"?: string;
}

export interface Activity {
  "@id"?: string;
  "@type"?: "prov:Activity" | string;
  "rdfs:label"?: string;
}

/* ---------- helpers ---------- */

/** Reference to another node by @id */
export interface Ref {
  "@id": string;
}

/** Language-tagged string */
export interface LangString {
  "@value": string;
  "@language"?: string;
}

/** Typed literal (e.g. xsd:dateTime, geo:wktLiteral) */
export interface TypedValue {
  "@value": string;
  "@type"?: string;
}

/** Top-level JSON-LD document shape */
export interface DcatJsonLd {
  "@context"?: Record<string, string | object>;
  "@graph"?: (
    | DcatDataset
    | Distribution
    | DataService
    | Agent
    | Location
    | PeriodOfTime
    | RightsStatement
    | LicenseDocument
    | Concept
    | Standard
    | Document
    | Activity
    | Record<string, unknown>
  )[];
  // or a single node when not using @graph
  [key: string]: unknown;
}
