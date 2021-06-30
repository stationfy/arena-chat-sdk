import { Site } from '@arena-im/chat-types';
import { Credentials } from '../auth';
import { RestAPI } from '../services/rest-api';

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
    const restAPI = RestAPI.getCachedInstance();

    const site = await restAPI.loadSite(apiKey);

    return site;
  }
}
