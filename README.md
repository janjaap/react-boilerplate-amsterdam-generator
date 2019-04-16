<img src="https://avatars3.githubusercontent.com/u/14022058?s=200&amp;v=4" height="120" alt="" />

# Datapunt React project generator

<a href="https://www.amsterdam.nl/bestuur-organisatie/organisatie/dienstverlening/basisinformatie/basisinformatie/overbasisinformatie/distributie/city-data/">Datapunt/City Data</a> flavoured Yeoman `react-boilerplate` generator.

## Introduction

Use this Yeoman generator to set up a new project, based on <a href="https://github.com/react-boilerplate/react-boilerplate">`react-boilerplate`</a>.

The generator takes care of:
- cloning (the latest tag of) the <a href="https://github.com/react-boilerplate/react-boilerplate">`react-boilerplate`</a> repository
- replacing properties and values in `package.json`, setting constants values and preparing `Jenkinsfile`
- adding necessary dependencies
- (optionally) installing all dependencies
- (optionally) pushing the initial commit

## Requirements

 - `npm >=5`
 - `node >=8`

Has **NOT** been tested on Windows.

## Installation

### Install Yeoman

```
$ npm install -g yo
```

### Clone this repository or

After cloning, `cd` into the folder the repository is cloned in and run:

```
$ npm link
```

This will create a global NPM package and you will be able to run the generator from any folder.

## Find through Yeoman CLI

Run

```
$ yo
```

and select `Install a generator`. Type `amsterdam-react-boilerplate` and select the match.

## Running

From the command line, run

```
$ yo amsterdam-react-boilerplate
```

or

```
$ yo
```

and select `Amsterdam React Boilerplate`.

## Installation steps

### 1. Github user and repository name

Press &lt;Enter&gt; or type 'Y' to enter repository details. The repository name and Github user name will be used to set the Git remote.
Press 'n' to skip.

<dl>
  <dt>Repository name</dt>
  <dd>Valid repo name.</dd>

  <dt>Github user/account name</dt>
  <dd>
    Valid Github user name. The generator will prompt for re-entering the data if the repository cannot be found in the given user's account. You can choose to skip that step and go with the values you entered. For instance, when there is no repository yet, but there will be one with the given name for that user.
  </dd>

  <dt>Do you want the generator to push the initial commit?</dt>
  <dd>Press &lt;Enter&gt; or type 'Y' to have the generator push the first commit (message: "First commit") to the remote repository.</dd>

  <dt>Choose the react-boilerplate tag you want to base your project on</dt>
  <dd>The generator will fetch the five latest tags from the <a href="https://github.com/react-boilerplate/react-boilerplate"><code>react-boilerplate</code></a> repository. Check the <a href="https://github.com/react-boilerplate/react-boilerplate/blob/master/Changelog.md">changelog</a> for details on each version.</dd>
</dl>

### 2. Project parameters

<dl>
  <dt>Project name</dt>
  <dd>The value for this input will be used to populate the <code>name</code> field in <code>package.json</code>, set the prefix for constants (in <code>constants.js</code> files), set the value for the <code>apple-mobile-web-app-title</code> meta tag in <code>index.html</code> and is printed in <code>Jenkinsfile</code>.</dd>

  <dt>Project title</dt>
  <dd>Readable project name. Is printed in <code>index.html</code> as the document title and is used to populate <code>manifest.json</code>. See <a href="#PWA parameters">PWA parameters</a>.</dd>

  <dt>Version</dt>
  <dd>The version is validated against a <a href="https://semver.org/">Semver</a> regex.</dd>

  <dt>Description (optional)</dt>
  <dd>Used to populate the <code>description</code> fields in <code>package.json</code> and <code>manifest.json</code>.</dd>

  <dt>Author</dt>
  <dd>Used to populate the <code>author</code> field in <code>package.json</code>.</dd>

  <dt>License</dt>
  <dd>Used to populate the <code>license</code> field in <code>package.json</code></dd>

  <dt>Language</dt>
  <dd>Has to be a valid <a href="https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes">ISO 639-1 language code</a>. Is used to set the application's default language and to resolve imports for language support in <code>app/app.js</code>.</dd>

  <dt>Subdomain</dt>
  <dd>Part of the <code>amsterdam.nl</code> domain on which the website will be hosted. The value is validated against a list of reserved subdomain names.</dd>

  <dt>API proxy dir (optional)</dt>
  <dd>Subdirectory on the <code>acc.data.amsterdam.nl</code> domain through which the application's API will be available. Useful for when the API isn't available and data structures need to be mocked with <a href="https://github.com/webpro/dyson">Dyson</a> during development.</dd>

  <dt>Run <code>npm install</code> after project generation?</dt>
  <dd>Press &lt;Enter&gt; or type 'Y' for the generator to install all NPM dependencies after the setup has completed.</dd>

  <dt>Truncate <code>README.md?</code></dt>
  <dd>Press &lt;Enter&gt; or type 'Y' to replace the source repo's readme file with the project's title and description. Typing 'n' will leave the original readme intact.</dd>
</dl>

### 3. Jenkinsfile parameters

<dl>
  <dt>Job name</dt>
  <dd>Used to configure the docker image creation and build step. Has to reference one of the IDs in the <a href="https://build.app.amsterdam.nl/repositories/">Docker registry</a>.</dd>

  <dt>Playbook</dt>
  <dd>Ansible deployment playbook name.</dd>

  <dt>Project ID</dt>
  <dd><code>docker-compose</code> Project name.</dd>
</dl>

### 4. PWA parameters

<dl>
  <dt>Do you want to have a manifest.json file generated?</dt>
  <dd>Press &lt;Enter&gt; or type 'Y' to configure the properties for the <code>manifest.json</code> file. Note that the file will only be generated at build-time.
  Pressing 'n' will remove the <code>WebpackPwaManifest</code> entry from Webpack's production configuration.</dd>

  <dt>Name</dt>
  <dd>See <a href="https://developer.mozilla.org/en-US/docs/Web/Manifest#name">developer.mozilla.org/en-US/docs/Web/Manifest</a> for details.</dd>

  <dt>Short name/dt>
  <dd>See <a href="https://developer.mozilla.org/en-US/docs/Web/Manifest#short_name">developer.mozilla.org/en-US/docs/Web/Manifest</a> for details.</dd>

  <dt>Description (optional)</dt>
  <dd>See <a href="https://developer.mozilla.org/en-US/docs/Web/Manifest#description">developer.mozilla.org/en-US/docs/Web/Manifest</a> for details.</dd>

  <dt>Background color</dt>
  <dd>See <a href="https://developer.mozilla.org/en-US/docs/Web/Manifest#background_color">developer.mozilla.org/en-US/docs/Web/Manifest</a> for details.</dd>

  <dt>Theme color</dt>
  <dd>See <a href="https://developer.mozilla.org/en-US/docs/Web/Manifest#theme_color">developer.mozilla.org/en-US/docs/Web/Manifest</a> for details.</dd>
</dl>
