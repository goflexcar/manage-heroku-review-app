# Manage Heroku Review Apps

by FastRuby.io

> Fork: This fork was made to release versions with up-to-date dependencies. Forked releases use `x` as the version prefix (ex `x1`) instead of `v` to differentiate from upstream releases.

# How to:

If you want to create a Review App when the label `create-review-app` is added to a PR (for example):

```yml
# .github/workflows/create-review-app.yml

name: Review App
on:
  pull_request:
    types: [labeled]

jobs:
  create-review-app:
    if: ${{ github.event.label.name == 'create-review-app' }}
    runs-on: ubuntu-latest

    steps:
      - uses: goflexcar/manage-heroku-review-app@x1
        with:
          action: create
        env:
          HEROKU_API_TOKEN: ${{ secrets.HEROKU_API_TOKEN }}
          HEROKU_PIPELINE_ID: ${{ secrets.HEROKU_PIPELINE_ID }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

If you want to destroy a review app when the PR is closed.

```yml
# .github/workflows/destroy-review-app.yml

name: Destroy Review App
on:
  pull_request:
    types: [closed]

jobs:
  destroy-review-app:
    steps:
      - uses: goflexcar/manage-heroku-review-app@x1
        with:
          action: destroy
        env:
          HEROKU_API_TOKEN: ${{ secrets.HEROKU_API_TOKEN }}
          HEROKU_PIPELINE_ID: ${{ secrets.HEROKU_PIPELINE_ID }}
```

> Note GITHUB_TOKEN is not needed for the `destroy` action

# Configuration

## Inputs:

### `action`

- `create` will trigger a Review App creation for the current PR, will fail if the Review App already exists
- `destroy` will trigger a Review App destroy for the current PR, if any

> Review Apps will be re-deployed automatically after a new push, there's no need to trigger any action

# Requirements:

## In GitHub

You have to setup 2 secrets in your repo (1):

- HEROKU_API_TOKEN: you can get this from your Heroku's settings (2)
- HEROKU_PIPELINE_ID: you can get this from the URL of the specific pipeline (3)

\*1 Go to `Settings` (of the repo), select `Secrets` on the sidebar, and click `New repository secret`

\*2 Go to `Account settings`, look for the `API Key` section and click `Reveal` to see the token

\*3 Open your pipeline in Heroku's website and extract the uuid from the url (`https://dashboard.heroku.com/pipelines/abc2e115-5cd9-48e9-b591-cf66c265e845` => `abc2e115-5cd9-48e9-b591-cf66c265e845`)

## In Heroku:

The target pipeline must already have Review Apps enabled and it should be using the new Review Apps version introduced in November 2019 https://devcenter.heroku.com/articles/github-integration-review-apps#changes (the older version can't be controlled with an API).

# How to contribute:

- Run `npm install` to get the needed dependencies
- Before committing changes, remember to rebuild the final .js file with `npm run prepare`
- Always commit the `dist/*` files
- After pushing the changes, make a new release in GitHub so you can target that version in the workflow config

> To show debug messages in the action's log, you can add a repo secret with the key `ACTIONS_STEP_DEBUG` and the value `true`

TODO:

- Only allow interactions of collaborators to trigger the actions to prevent abuse.
- Add linter/prettier
