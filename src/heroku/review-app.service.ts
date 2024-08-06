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
    const ra: ReviewApp = await this.client.post('/review-apps', {
      body: input,
    });

    this.logger?.debug(JSON.stringify(ra));
    this.logger?.info('Review App created');

    return ra;
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
      this.logger?.info(`Review App not found for PR ${pr_number} (nothing to do)`);
      return;
    }

    this.logger?.info(`Destroying Review App for PR ${pr_number}`);
    this.logger?.debug(JSON.stringify(ra));

    // Delete review app
    const response = await this.client.delete(`/review-apps/${ra.id}`);

    this.logger?.debug(JSON.stringify(response));
    this.logger?.info('Review App destroyed');

    return ra;
  }
}
