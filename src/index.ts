import * as core from '@actions/core';
import * as github from '@actions/github';
import HerokuClient from 'heroku-client';
import { GitHubService } from './github/github.service';
import { ReviewAppService } from './heroku/review-app.service';

(async function run() {
  try {
    core.debug(JSON.stringify(github.context));

    // Get environment values
    const { HEROKU_API_TOKEN, HEROKU_PIPELINE_ID, GITHUB_TOKEN } = process.env;
    if (!HEROKU_API_TOKEN || !HEROKU_PIPELINE_ID) {
      throw new Error('HEROKU_API_TOKEN and HEROKU_PIPELINE_ID are both required');
    }

    // Create ReviewAppService instance
    const service = new ReviewAppService({
      client: new HerokuClient({ token: HEROKU_API_TOKEN }),
      pipeline: HEROKU_PIPELINE_ID,
      logger: core,
    });

    // Get PR context
    const pr = github.context.payload.pull_request;
    if (!pr) {
      throw new Error('Missing pull_request payload context');
    }

    // Handle action
    switch (core.getInput('action')) {
      case 'create': {
        if (!GITHUB_TOKEN) {
          throw new Error('GITHUB_TOKEN is required to create review apps');
        }

        // Create GitHubService instance
        const gh = new GitHubService({
          octokit: github.getOctokit(GITHUB_TOKEN),
          logger: core,
        });

        // Create review app
        const { owner, repo } = github.context.issue;
        const { ref, sha } = pr.head;
        const app_id = await service.createReviewApp({
          branch: ref,
          pr_number: pr.number,
          version: sha,
          url: await gh.getTarballUrl(owner, repo, ref),
        });

        // Set outputs
        core.setOutput('app_id', app_id);
        core.setOutput('web_url', await service.getAppWebUrl(app_id));
        break;
      }

      case 'destroy': {
        // Destroy review app
        const app_id = await service.destroyReviewApp(pr.number);

        // Set outputs
        core.setOutput('app_id', app_id);
        break;
      }

      default:
        core.warning(
          "Invalid action, no action was performed, use one of 'create' or 'destroy'"
        );
        break;
    }
  } catch (error) {
    if (error instanceof Error || typeof error === 'string') {
      core.setFailed(error);
    } else {
      core.setFailed('Unknown fatal error');
    }
  }
})();
