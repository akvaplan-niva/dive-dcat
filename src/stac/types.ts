export interface StacCollection {
  id: string;
  title: string;
  links: StacLink[];
  "sci:doi": string;
}

export interface StacLink {
  rel: string;
  href: string;
}
