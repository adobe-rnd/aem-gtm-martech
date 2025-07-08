:construction: This is an early access technology and is still heavily in development. Reach out to us over Slack before using it.

# AEM Edget Delivery Services Marketing Technology - GA/GTM

he AEM Marketing Technology plugin helps you quickly set up a MarTech stack based on Google Analytics & Google Tag Manager for your AEM project. It is currently available to customers in collaboration with AEM Engineering via co-innovation VIP Projects. To implement your use cases, please reach out to the AEM Engineering team in the Slack channel dedicated to your project.

## Features

The AEM MarTech plugin is essentially a wrapper around the GA4 and GTM Libraries.

## Preqequisites


## Installation

Add the plugin to your AEM project by running:
```sh
git subtree add --squash --prefix plugins/gtm-martech git@github.com:adobe-rnd/aem-gtm-martech.git main
```

If you later want to pull the latest changes and update your local copy of the plugin
```sh
git subtree pull --squash --prefix plugins/gtm-martech git@github.com:adobe-rnd/aem-gtm-martech.git main
```

If you prefer using `https` links you'd replace `git@github.com:adobe-rnd/aem-gtm-martech.git` in the above commands by `https://github.com/adobe-rnd/aem-gtm-martech.git`.

If the `subtree pull` command is failing with an error like:
```
fatal: can't squash-merge: 'plugins/martech' was never added
```
you can just delete the folder and re-add the plugin via the `git subtree add` command above.

If you use some ELint at the project level (or equivalent), make sure to update ignore minified files in your `.eslintignore`:
```
*.min.js
```