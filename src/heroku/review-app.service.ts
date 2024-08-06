import type HerokuClient from 'heroku-client';
import type { Logger } from '../types';

interface ReviewApp {
  id: string;
  pr_number: number;
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
    const app: ReviewApp = await this.client.post('/review-apps', {
      body: input,
    });

    this.logger?.debug(JSON.stringify(app));
    this.logger?.info('Review App created');

    return app.id;
  }

  async destroyReviewApp(pr_number: number) {
    this.logger?.info('Fetching Review Apps list');

    // List review apps for pipeline
    const reviewApps: ReviewApp[] = await this.client.get(
      `/pipelines/${this.pipeline}/review-apps`
    );

    // Find review app by PR number
    const app = reviewApps.find((app) => app.pr_number == pr_number);
    if (!app) {
      this.logger?.info('Review App not found (nothing to do)');
      return;
    }

    this.logger?.info('Destroying Review App');

    // Delete review app
    await this.client.delete(`/review-apps/${app.id}`);

    this.logger?.info('Review App destroyed');

    return app.id;
  }

  async getAppWebUrl(id: string) {
    const { web_url }: { web_url: string } = await this.client.get(`/apps/${id}`);

    return web_url;
  }
}
