import type { getOctokit } from '@actions/github';
import type { Logger } from '../types';

type TarballResponse = {
  status: number;
  url: string;
};

export type GitHubServiceOptions = {
  logger?: Logger;
  octokit?: ReturnType<typeof getOctokit>;
};

export class GitHubService {
  logger?: GitHubServiceOptions['logger'];
  octokit: GitHubServiceOptions['octokit'];

  constructor({ logger, octokit }: GitHubServiceOptions) {
    this.logger = logger;
    this.octokit = octokit;
  }

  async getTarballUrl(owner: string, repo: string, ref: string) {
    if (!this.octokit) {
      throw new Error(
        "Couldn't connect to GitHub, make sure the GITHUB_TOKEN is a valid token"
      );
    }

    this.logger?.debug('Fetching tarball URL');

    const { url }: TarballResponse = await this.octokit.rest.repos.downloadTarballArchive(
      {
        method: 'HEAD',
        owner,
        repo,
        ref,
      }
    );

    this.logger?.debug(`Fetched tarball URL ${url}`);

    return url;
  }
}
