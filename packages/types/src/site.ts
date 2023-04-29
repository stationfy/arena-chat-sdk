export interface Site {
  blocked?: boolean;
  config?: SiteConfig;
  deleted?: boolean;
  displayName: string;
  featureFlags?: SiteFeatureFlags;
  image?: string;
  photoURL?: string;
  slug: string;
  uid?: string;
  websiteUrl?: string;
  _id: string;
  settings: EmbedSettings;
}

interface SiteConfig {
  [key: string]: string;
}

interface SiteFeatureFlags {
  [key: string]: any;
}

export interface EmbedSettings {
  graphqlPubApiKey: string;
}
