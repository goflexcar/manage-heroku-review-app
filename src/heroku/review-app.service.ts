import type HerokuClient from 'heroku-client';
import type { Logger } from '../types';

interface ReviewApp {
  id: string;
  pr_number: number;
  app?: {
    id: string;
  };
}

export type CreateReviewAppInput = {
  branch: string;
  pr_number: number;
  url: string; // tarball URL
  version: string; // commit SHA
};

export type ReviewAppServiceOptions = {
  client: HerokuClient;
  logger?: Logger;
  pipeline: string; // Heroku pipeline ID
};

export class ReviewAppService {
  client: ReviewAppServiceOptions['client'];
  logger: ReviewAppServiceOptions['logger'];
  pipeline: ReviewAppServiceOptions['pipeline'];

  constructor({ client, logger, pipeline: pipelineId }: ReviewAppServiceOptions) {
    this.client = client;
    this.logger = logger;
    this.pipeline = pipelineId;
  }

  async createReviewApp({ branch, pr_number, url, version }: CreateReviewAppInput) {
    const input = {
      branch,
      pipeline: this.pipeline,
      source_blob: {
        url,
        version,
      },
      pr_number,
    };

    this.logger?.info('Creating Review App');
    this.logger?.debug(JSON.stringify(input));

    // Create review app
    const { id }: ReviewApp = await this.client.post('/review-apps', {
      body: input,
    });

    this.logger?.info(`Review App created ${id}`);

    this.logger?.info(`Get app ID for review app ID ${id}`);

    // Get app ID (this is not returned in the POST response but is available soon after)
    const { app }: ReviewApp = await this.client.get(`/review-apps/${id}`);

    this.logger?.info(`Got app ID ${app?.id} for review app ID ${id}`);

    return app?.id;
  }

  async destroyReviewApp(pr_number: number) {
    this.logger?.info('Fetching Review Apps list');

    // List review apps for pipeline
    const reviewApps: ReviewApp[] = await this.client.get(
      `/pipelines/${this.pipeline}/review-apps`
    );

    // Find review app by PR number
    const ra = reviewApps.find((ra) => ra.pr_number == pr_number);
    if (!ra) {
      this.logger?.info('Review App not found (nothing to do)');
      return;
    }

    this.logger?.info('Destroying Review App');

    // Delete review app
    await this.client.delete(`/review-apps/${ra.id}`);

    this.logger?.info('Review App destroyed');

    return ra.app?.id;
  }

  async getAppWebUrl(id?: string) {
    try {
      if (!id) {
        return;
      }

      const { web_url }: { web_url: string } = await this.client.get(`/apps/${id}`);

      return web_url;
    } catch (e) {
      this.logger?.warning(`Unable to fetch web_url for id ${id}`);
      this.logger?.warning(e as Error);
    }
  }
}
