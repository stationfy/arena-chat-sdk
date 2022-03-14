import { Site } from '@arena-im/chat-types';
import { fetchCachedAPIData } from '../services/cached-api';
import { Credentials } from '../auth';

export class OrganizationSite {
  private static organizationSiteInstance: OrganizationSite;
  private site: Site | null = null;

  public static get instance(): OrganizationSite {
    if (!OrganizationSite.organizationSiteInstance) {
      OrganizationSite.organizationSiteInstance = new OrganizationSite();
    }

    return OrganizationSite.organizationSiteInstance;
  }

  public async getSite(): Promise<Site> {
    if (this.site === null) {
      this.site = await this.fetchSiteData(Credentials.apiKey);
    }

    return this.site;
  }

  private async fetchSiteData(apiKey: string): Promise<Site> {
    const site = await fetchCachedAPIData<Site>(`/sites/${apiKey}`);

    if (site === null) {
      throw new Error('Cannot fetch site data');
    }

    return site;
  }
}
