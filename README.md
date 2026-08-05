# Heirloom
> A minimal but powerful markdown site builder for the ages.

## Overview
**Heirloom** is a static site generator designed for simplicity and permanence. Content is plain markdown, stored in a regular git repository, and rendered to static HTML through the [unified](https://unifiedjs.com/) ecosystem. The built website has zero external runtime dependencies, vendor-locking and is suitable for running on any static site host whatsoever (or even locally).

Markdown syntax or transformation support can be added or removed as simply as adding or removing a unified plugin in the code. Moreover, since the markdown source of a Heirloom website is just an ordinary git repository, collaborating on writing and editing the website's content is the same as collaborating on any other git project.

This repository contains the Heirloom SvelteKit code that you can clone to start your own website. The markdown converter is built directly into the website, so there's no need for a separate tool. To use Heirloom:
1. Set the `hl-publish` frontmatter property to `true` on all markdown files you want to put on the website.
2. Create your own copy of this repository (forking or using the template feature on GitHub is useful for this).
3. Link it to any website hosting service of your preference. If the host has a preset for SvelteKit projects, you probably want to use it. The build script is `npm run build` and the statically-generated site is placed in the `build` folder.
4. In the host, set the `HEIRLOOM_SOURCE_REPO_URL` environment variable to the URL of the repository containing the markdown you want to publish. Heirloom uses a simple `git clone` to fetch the content before building, so make sure the URL works with `git clone`.
5. Deploy. The website's navigation will be the same as the file structure of your markdown repository.

Heirloom will automatically grab all markdown files with `hl-publish: true` in the frontmatter and make them into static website pages. Links, navigation, embeds and everything else is handled automatically.

### Example

Say you want to deploy a website on Vercel with the content of the markdown repository `my_username/my_content`. In this case, you could:
1. Go through every markdown file in `my_username/my_content` that you want to turn into a website page and add the `hl-publish: true` to all of them. If you have a lot of files, you might want to use a script to do this programmatically.
2. Clone this repository into `my_usename/my_heirloom_site`.
3. Set up a Vercel project linked to `my_username/my_heirloom_site` using the SvelteKit preset.
4. Go to the Vercel project settings and under Environment Variables, create a variable called `HEIRLOOM_SOURCE_REPO_URL` with value `https://github.com/my_username/my_content`.
5. Trigger a manual redeploy. You can tell it to delete the build cache just to be safe. Vercel will call `npm run build`, which will `git clone https://github.com/my_username/my_content` and build the website with it.

Note that Vercel triggers a deployment every time its linked repo's main branch is pushed to. Since this repo is `my_username/my_heirloom_site` and not `my_username/my_content`, updating the markdown content will *not* automatically rebuild your website. You probably want to set up a GitHub action on `my_username/my_content` that pings a Vercel Deploy Hook on every commit to automatically redeploy the website.

## Building
If you want to use Heirloom to build a site locally, clone this repo on your machine, then set the `HEIRLOOM_SOURCE_REPO_URL` to the URL of the repo containing the markdown content, then run `npm run build`. This'll clone the repo into the `assets` folder. All media (e.g., images) will also be copied to the `static/media` folders so that SvelteKit can use them during the build process. Once your run `npm run build` once, you can use `npm run build:cached` to avoid cloning the repo every time; it'll reuse whatever is in the `assets` folder. The built website is delivered in the `build` folder: this is what goes into the website host or VPS to serve the site.

For help with developing Heirloom itself, this repository also ships development assets in the `dev-assets` folder. If you omit the `HEIRLOOM_SOURCE_REPO_URL` variabile when building (or using `npm run dev`), Heirloom will instead use the `dev-assets` folder as the source repo.

## License

This project is released under the Apache 2.0 License.