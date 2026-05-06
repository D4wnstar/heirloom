# Heirloom
> A minimal but powerful markdown site builder for the ages.

## Overview
**Heirloom** is a static site generator designed for simplicity and permanence. Content is plain markdown, stored in a regular git repository, and rendered to static HTML through the [unified](https://unifiedjs.com/) ecosystem. The built website has zero external runtime dependencies, vendor-locking and is suitable for running on any static site host whatsoever (or even locally).

Markdown syntax or transformation support can be added or removed as simply as adding or removing a unified plugin in the code. Moreover, since the markdown source of a Heirloom website is just an ordinary git repository, collaborating on writing and editing the website's content is the same as collaborating on any other git project.

This repository contains the Heirloom SvelteKit code that you can clone to start your own website. The markdown converter is built directly into the website, so there's no need for a separate tool. To use Heirloom:
1. Clone this repository into your own repository (forking or using the template feature on GitHub is useful for this).
2. Link it to any website hosting service of your preference.
3. In the host, set the `HEIRLOOM_SOURCE_REPO_URL` environment variable to the repository with the markdown you want to publish.
4. Set the `hl-publish` frontmatter property to `true` on all markdown files you want to put on the website.
5. Deploy.

Heirloom will automatically grab all markdown files with `hl-publish: true` and make them into website pages. Links, navigation and everything else is handled automatically. And if you want to handle deployment more manually, you can build the project locally on your machine: SvelteKit will put the compiled site in the `build` folder for you to do whatever you like with it.