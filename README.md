<img src="https://avatars3.githubusercontent.com/u/14022058?s=200&amp;v=4" height="120" alt="" />

# Datapunt React project generator

[Datapunt/City Data](https://www.amsterdam.nl/bestuur-organisatie/organisatie/dienstverlening/basisinformatie/basisinformatie/overbasisinformatie/distributie/city-data/) flavoured Yeoman `react-boilerplate` generator.

## Introduction

Use this Yeoman generator to set up a new project, based on [`react-boilerplate`](https://github.com/react-boilerplate/react-boilerplate).

The generator takes care of:
- cloning (the latest tag of) the [`react-boilerplate`](https://github.com/react-boilerplate/react-boilerplate) repository
- replacing properties and values in `package.json`, setting constants values and preparing `Jenkinsfile`
- adding necessary dependencies
- (optionally) installing all dependencies
- (optionally) pushing the initial commit

## Installation

### Install Yeoman

```
$ npm install -g yo
```

### Clone this repository

After cloning, `cd` into the folder the repository is cloned in and run:

```
npm link
```

This will create a global NPM package and you will be able to run the generator from any folder.

## Running

From the command line, run

```
yo arbp
```

or

```
yo
```

and select `Arbp`.

## Installation steps

### 1. Github user and repository name

Press <Enter> or type 'Y' to enter repository details. The repository name and Github user name will be used to set the Git remote.
Press 'n' to skip.

- Repository name

  Valid repo name

- Github user/account name

  Valid Github user name. The generator will prompt for re-entering the data if the repository cannot be found in the given user's account. You can choose to skip that step and go with the values you entered. For instance, when there is no repository yet, but there will be one with the given name for that user.

- Do you want the generator to push the initial commit?

  Press <Enter> or type 'Y' to have the generator push the first commit (message: "First commit") to the remote repository.

- Choose the react-boilerplate tag you want to base your project on

  The generator will fetch the five latest tags from the [`react-boilerplate`](https://github.com/react-boilerplate/react-boilerplate) repository. Check the [changelog](https://github.com/react-boilerplate/react-boilerplate/blob/master/Changelog.md) for details on each version.

### 2. Project parameters

- Project name

  The value for this input will be used to populate the `name` field in `package.json`, set the prefix for constants (in `constants.js` files), set the value for the `apple-mobile-web-app-title` meta tag in `index.html` and is printed in `Jenkinsfile`.

- Project title

  Readable project name. Is printed in `index.html` as the document title and is used to populate `manifest.json`. See [PWA](#PWA)

- Version

  The version is validated against a [Semver](https://semver.org/) regex.

- Description (optional)

  Used to populate the `description` fields in `package.json` and `manifest.json`

- Author

  Used to populate the `author` field in `package.json`

- License

  Used to populate the `license` field in `package.json`

- Language

  Has to be a valid [ISO 639-1 language code](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes). Is used to set the application's default language and to resolve imports for language support in `app/app.js`.

- Subdomain

  Part of the `amsterdam.nl` domain on which the website will be hosted. The value is validated against a list of reserved subdomain names.

- API proxy dir (optional)

  Subdirectory on the `acc.data.amsterdam.nl` domain through which the application's API will be available. Useful for when the API isn't available and data structures need to be mocked with [Dyson](https://github.com/webpro/dyson) during development.

- Run `npm install` after project generation?

  Press <Enter> or type 'Y' for the generator to install all NPM dependencies after the setup has completed.

- Truncate `README.md?`

  Press <Enter> or type 'Y' to replace the source repo's readme file with the project's title and description. Typing 'n' will leave the original readme intact.

### 3. Jenkinsfile parameters

- Job name

  Used to configure the docker image creation and build step. Has to reference one of the IDs in the [Docker registry](https://build.app.amsterdam.nl/repositories/).

- Playbook

  Ansible deployment playbook name

- Project ID

  `docker-compose` Project name

### 4. PWA parameters

- Do you want to have a manifest.json file generated?

  Press <Enter> or type 'Y' to configure the properties for the `manifest.json` file. Note that the file will only be generated at build-time.
  Pressing 'n' will remove the `WebpackPwaManifest` entry from Webpack's production configuration.

- Name

  See [https://developer.mozilla.org/en-US/docs/Web/Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest#name) for details

- Short name

  See [https://developer.mozilla.org/en-US/docs/Web/Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest#short_name) for details

- Description (optional)

  See [https://developer.mozilla.org/en-US/docs/Web/Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest#description) for details

- Background color

  See [https://developer.mozilla.org/en-US/docs/Web/Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest#background_color) for details

- Theme color

  See [https://developer.mozilla.org/en-US/docs/Web/Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest#theme_color) for details
