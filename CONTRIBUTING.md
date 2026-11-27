# Contributing

If you are new to open source or simply would like a review this is great place resource.
[Open Source Guide](https://opensource.guide/)

Contributions are welcome!

Finnovate represents core guiding principles, we ask that you do the same when looking to contribute.

> Act with urgency and accountability

> Treat others with kindness

> Be open and honest

Considering the following questions and if the answer to any of these questions for your actions is not clear, re-consider your approach.

> Is it true?

> Is it necessary?

> Is it kind?

## Guidelines

- Keep the pull request focused
- Write clear commit messages. A good reference is [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
- Remember the code that never breaks in production is the code that isn't there. Less is more.

## Contributing Workflow

### Getting Started

1. **Fork** this repository by clicking the "Fork" button at the top of repo page

   > If you are new to forking/git workflows please open an issue asking for help!

2. **Clone** your fork locally

- Typically ssh with gpg signing keys are recommended when interacting with Github

  > [Github ssh](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)

  > [Github commit signature verification](https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification)

- Otherwise you can use good ol' `https`

```bash
 git clone https://github.com/<your-username>/<forked-repo-name>.git
   cd <forked-repo-name>
```

3. Remember to keep the upstream and origin branches in sync!

```bash
git checkout main
git fetch upstream
git merge upstream/main # or rebase
git push origin main
```

### Making Changes

1. Create a new branch for your work

> Old School

```bash
git checkout -b (feature|feat|bugfix|docs)/short-description
```

> New School

```bash
git switch -c (feature|feat|bugfix|docs)/short-description
```

2. Makes changes then commit them

```bash
git add .
git push origin <your-branch-name>
```

3. (Optional) In an act of kindness and linear git history please squash (minimally) and ideally rebase your changes

```bash
git rebase upstream/main
```

- If a conflict occurs, Git will pause the rebase

```bash
# edit the conflicted files

git add <resolved file>
git rebase --continue
```

- You may need to use the `--force-with-lease` Only use the `--force` flag as a last and final resort. `--force` could overwrite someone's (maybe even your own) work!

4. Publish the changes to your fork

```bash
git push origin <your-branch-name> --force-with-lease
```

### Submitting a PR

1. Head to your fork on Github and click **Compare & pull request**
2. Ensure the PR targets `upstream/main`
3. Fill in a clear title and description, linked to an issue if possible
4. Publish the PR and response to any feedback keeping in mind our guiding principles

## Questions?

We are here to help and improve. If you have suggestions/issues/improvements you would like to see in the repository please open an issue to discuss!
