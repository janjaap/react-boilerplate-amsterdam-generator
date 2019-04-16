/* eslint-disable no-underscore-dangle */
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const fs = require('fs');
const merge = require('deepmerge');
const childProces = require('child_process');
const fetch = require('node-fetch');

const validators = require('./validators');
const utils = require('./utils');

const { execSync, spawnSync } = childProces;

const { nonEmptyString, noSpacesString, semverRegex, languageCode, subdomain, githubUsername } = validators;
const { deleteFolderRecursive } = utils;

module.exports = class App extends Generator {
  async initializing() {
    this.github = {
      username: 'Amsterdam',
      repository: '',
      url: '',
      autoCommit: true,
    };

    this.project = {
      author: 'Datapunt Amsterdam',
      name: '',
      seoName: '',
      description: '',
      license: 'MPL-2.0',
      version: '0.0.1',
      language: 'nl',
      installDependencies: true,
    };

    this.pwa = {
      name: '',
      shortName: '',
      description: '',
      backgroundColor: '#ffffff',
      themeColor: '#ec0000',
      useManifest: true,
    };

    this.jenkins = {
      job: '',
      playbook: '',
      projectId: '',
    };

    // var that is set after entering wrong repo credentials and choosing to re-enter the values
    this.reEnterGithubCreds = false;

    this.packageJson = {};

    this._finish = this._finish.bind(this);

    await this._showIntro();
  }

  async prompting() {
    await this._determineSetupState();

    await this._getProjectDetails();

    await this._getJenkinsDetails();

    await this._getPWADetails();
  }

  async configuring() {
    this._showBrand();
    this._showInstallSteps(0);

    const { hash, tag, url } = this.github;

    // check out the tag
    const gitClone = spawnSync('git', [
      'clone',
      '--branch',
      tag,
      '--single-branch',
      '--quiet',
      'git@github.com:react-boilerplate/react-boilerplate.git',
      '.',
    ]);

    if (gitClone.status !== 0) {
      this._showError('Could not clone the base repository', true);
    }

    spawnSync('git', ['checkout', '-b', 'master']);
    spawnSync('git', ['rebase', hash]);
    spawnSync('git', ['remote', 'set-url', 'origin', url]);

    // eslint-disable-next-line global-require
    this.packageJson = require(this.destinationPath('package.json'));
  }

  writing() {
    this._showBrand();
    this._showInstallSteps(1);

    this._setProjectDetails();
    this._setDependencies();
    this._setScripts();
    this._setWebpackRules();
    this._setPWADetails();
    // this._setLanguageConfig();

    this._writePackageJson();
  }

  end() {
    this._showBrand();
    this._showInstallSteps(2);

    this._copyTemplateFiles();
  }

  _showError(error, bail = false) {
    this._showBrand();
    this.log(
      chalk.bold.red(`
 ${error}
`),
    );

    if (bail) {
      process.exit(1);
    }
  }

  _showIntro() {
    this._showBrand();
    const destRoot = chalk.grey(`(${this.destinationRoot()})`);

    this.log(
      chalk.white(`
 This generator will prepare a (${chalk.cyan('React')}) Datapunt project by doing the following:
 - clone (the latest tag of) the https://github.com/react-boilerplate/react-boilerplate repository
 - append Datapunt specific dependencies to package.json
 - copy template files into the project folder and
 - push the initial commit and install the dependencies (both are optional)

 If you so choose to not install the dependencies, but do have the initial commit pushed, there
 will be uncommitted files (package-lock.json) after the push which you will have to commit and
 push manually.

 The project will be installed in the current working directory:
 ${destRoot}
 This directory needs to be empty so that the base repository can be cloned.
 `),
    );

    return this.prompt([
      {
        name: 'continue',
        type: 'confirm',
        message: 'Continue?',
      },
    ]);
  }

  _showInstallSteps(stepNumber = 0) {
    const steps = [
      'Cloning react-boilerplate/react-boilerplate',
      'Updating package.json and webpack configuration',
      'Copying template files',
      this.project.installDependencies && 'Installing dependencies',
      this.github.autoCommit && 'Running linter and pushing initial commit',
      `Installation of project '${this.project.seoName}' complete`,
    ].filter(Boolean);

    let stepNr = stepNumber;

    if (stepNumber > steps.length - 1) {
      stepNr -= 1;
    }

    const stepLines = steps
      .map((step, index) => {
        const complete = index < stepNumber ? ' 🆗' : '...';
        const stepLine = ` ${index + 1}. ${step}${complete}`;
        let color = index === stepNr ? chalk.yellow : chalk.dim.yellow;

        // last line will be green
        if (index === steps.length - 1) {
          color = index === stepNr ? chalk.green : chalk.dim.green;
        }

        return color(stepLine);
      })
      .join('\n');

    this.log(`\n${stepLines}`);
  }

  _showBrand() {
    this.spawnCommandSync('clear');

    this.log(
      chalk.bold.red(`
 X ${chalk.white('Gemeente Amsterdam')}
 X ${chalk.reset.italic.white('react-boilerplate generator')}
 X`),
    );
  }

  _showSectionTitle(title, caption) {
    const lines = [chalk.cyan(`\n ${title}`), caption && chalk.reset.italic(` ${caption}`)].filter(Boolean);

    this.log(lines.join('\n'), '\n');
  }

  async _determineSetupState() {
    this._showBrand();

    const files = fs.readdirSync(this.destinationRoot());
    if (files.length) {
      this.log(chalk.bold.red('Run the generator in an empty folder'));
      process.exit(1);
    }

    this._showSectionTitle(
      'Github user and repository name',
      'Credentials for the repository in which the newly created project will be stored',
    );

    let useRepo = true;

    if (!this.reEnterGithubCreds) {
      ({ useRepo } = await this.prompt([
        {
          name: 'useRepo',
          type: 'confirm',
          message: 'Is there an existing repo you want to use for the new project?',
          when: !this.reEnterGithubCreds,
          default: true,
        },
      ]));
    }

    if (useRepo) {
      await this.prompt([
        {
          name: 'repository',
          message: 'Repository name:',
          validate: nonEmptyString,
        },
        {
          name: 'username',
          message: 'Github user/account name:',
          default: this.github.username,
          validate: githubUsername,
        },
        {
          name: 'autoCommit',
          type: 'confirm',
          message: 'Do you want the generator to push the initial commit?',
          default: this.github.autoCommit,
        },
      ]).then(async ({ username, repository, autoCommit }) => {
        // using stdout to reset the cursor and overwrite the printed line
        process.stdout.write(`  Checking for repository...\r`);

        const repoEndpoint = `https://api.github.com/repos/${username}/${repository}`;
        const response = await fetch(repoEndpoint);
        const { id, git_url: gitURL } = await response.json();

        if (!id) {
          this.log(`  Checking for repository... ❗\n  Repository could not be found`);

          await this.prompt([
            {
              name: 'changeInput',
              type: 'confirm',
              message: 'Re-enter user and repository name?',
            },
          ]).then(async ({ changeInput }) => {
            if (changeInput) {
              this.reEnterGithubCreds = true;
              await this._determineSetupState();
            }
          });
        } else {
          this.log(`  Checking for repository... 🆗`);

          this.github.username = username;
          this.github.repository = repository;
          this.github.autoCommit = autoCommit;
          this.github.url = gitURL;

          await this._getBoilerplateTags();
        }
      });
    } else {
      this.github.autoCommit = false;
      await this._getBoilerplateTags();
    }
  }

  async _getBoilerplateTags() {
    process.stdout.write(`  Getting react-boilerplate tags...\r`);

    // get the latest tag
    const listTags = 'git ls-remote --tags --quiet git@github.com:react-boilerplate/react-boilerplate.git | tail -5';
    const output = await execSync(listTags)
      .toString()
      .trim();

    this.log(`  Getting react-boilerplate tags... 🆗`);

    const commitsAndTags = output.match(/^([^\s]{40})\s*refs\/tags\/(.+)\s*$/gim);
    const choices = commitsAndTags.reverse().map(line => {
      const [, hash, tag] = line.match(/^([^\s]{40})\s*refs\/tags\/(.+)\s*$/);

      return {
        hash,
        tag,
      };
    });

    return this.prompt([
      {
        name: 'tag',
        type: 'list',
        message: 'Choose the react-boilerplate tag you want to base your project on:',
        choices: choices.map(item => item.tag),
      },
    ]).then(({ tag }) => {
      const { hash } = choices.find(choice => tag === choice.tag);
      this.github.hash = hash;
      this.github.tag = tag;
    });
  }

  _getProjectDetails() {
    this._showBrand();
    this._showSectionTitle(
      'Project parameters',
      'Used for package.json properties, constants values and template files value replacements',
    );

    return this.prompt([
      {
        name: 'name',
        message: `Project name ${chalk.reset.dim.white('(lowercase, no spaces)')}:`,
        validate: noSpacesString,
      },
      {
        name: 'seoName',
        message: `Project title ${chalk.reset.dim.white('(SEO)')}:`,
        validate: nonEmptyString,
      },
      {
        name: 'version',
        message: 'Version:',
        default: this.project.version,
        validate: semverRegex,
      },
      {
        name: 'description',
        message: 'Description:',
      },
      {
        name: 'author',
        message: 'Author',
        default: this.project.author,
      },
      {
        name: 'license',
        message: 'License:',
        default: this.project.license,
      },
      {
        name: 'language',
        message: `Language ${chalk.reset.dim.white('(ISO 639-1)')}:`,
        default: this.project.language,
        validate: languageCode,
      },
      {
        name: 'subdomainName',
        message: `Subdomain ${chalk.reset.dim.white('(<subdomain>.amsterdam.nl)')}:`,
        validate: subdomain,
      },
      {
        name: 'apiProxyDir',
        message: `API proxy dir ${chalk.reset.dim.white('(acc.data.amsterdam.nl/<dir>)')}:`,
      },
      {
        name: 'installDependencies',
        type: 'confirm',
        message: 'Run `npm install` after project generation?',
        default: true,
      },
      {
        name: 'truncateReadme',
        type: 'confirm',
        message: 'Truncate README.md?',
        default: true,
      },
    ]).then(answers => {
      const {
        apiProxyDir,
        author,
        description,
        installDependencies,
        language,
        license,
        name,
        seoName,
        subdomainName,
        truncateReadme,
        version,
      } = answers;

      this.project.author = author;
      this.project.description = description;
      this.project.installDependencies = installDependencies;
      this.project.language = language;
      this.project.license = license;
      this.project.name = name;
      this.project.seoName = seoName;
      this.project.version = version;
      this.project.subdomain = subdomainName;
      this.project.apiProxyDir = apiProxyDir;
      this.project.truncateReadme = truncateReadme;
    });
  }

  _getJenkinsDetails() {
    this._showBrand();
    this._showSectionTitle('Jenkinsfile parameters', 'Required for configuring deployment');

    return this.prompt([
      {
        name: 'job',
        message: 'Job name:',
        validate: nonEmptyString,
      },
      {
        name: 'playbook',
        message: 'Playbook:',
        validate: nonEmptyString,
      },
      {
        name: 'projectId',
        message: 'Project ID:',
        validate: nonEmptyString,
      },
    ]).then(({ job, playbook, projectId }) => {
      this.jenkins.job = job;
      this.jenkins.playbook = playbook;
      this.jenkins.projectId = projectId;
    });
  }

  _getPWADetails() {
    this._showBrand();
    this._showSectionTitle(
      'PWA parameters',
      'The input for the parameters below will be used to populate the manifest.json file (production only)',
    );

    return this.prompt([
      {
        name: 'useManifest',
        type: 'confirm',
        message: 'Do you want to have a manifest.json file generated?',
        default: true,
      },
    ]).then(({ useManifest }) => {
      if (useManifest) {
        return this.prompt([
          {
            name: 'name',
            message: 'Name:',
            default: this.project.seoName,
            validate: nonEmptyString,
          },
          {
            name: 'shortName',
            message: 'Short name:',
            default: this.project.name,
            validate: nonEmptyString,
          },
          {
            name: 'description',
            message: 'Description:',
          },
          {
            name: 'backgroundColor',
            message: 'Background color:',
            default: this.pwa.backgroundColor,
            validate: nonEmptyString,
          },
          {
            name: 'themeColor',
            message: 'Theme color:',
            default: this.pwa.themeColor,
            validate: nonEmptyString,
          },
        ]).then(({ name, shortName, description, backgroundColor, themeColor }) => {
          this.pwa.name = name;
          this.pwa.shortName = shortName;
          this.pwa.description = description;
          this.pwa.backgroundColor = backgroundColor;
          this.pwa.themeColor = themeColor;
        });
      }

      this.pwa.useManifest = false;
      return null;
    });
  }

  _updatePackageJson(values) {
    this.packageJson = merge(this.packageJson, values);
  }

  _writePackageJson() {
    // remove first to prevent diff conflict
    if (fs.existsSync(this.destinationPath('package.json'))) {
      fs.unlinkSync(this.destinationPath('package.json'));
    }

    return this.fs.writeJSON(this.destinationPath('package.json'), this.packageJson);
  }

  _setProjectDetails() {
    const { url } = this.github;
    const { author, version, name, description, license } = this.project;

    const projectDetails = {
      author,
      version,
      name,
      description,
      license,
      repository: {
        url,
      },
    };

    this._updatePackageJson(projectDetails);
  }

  /**
   * Applies rules for SCSS parsing and adds env var configuration to the base Webpack configuration file
   */
  _setWebpackRules() {
    const configFile = this.destinationPath('internals/webpack/webpack.base.babel.js');

    /* eslint-disable no-useless-escape */
    const sassRule = `
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
`;
    /* eslint-ensable no-useless-escape */

    const externals = `
  externals: {
    globalConfig: JSON.stringify(
      // eslint-disable-next-line global-require
      require(path.resolve(process.cwd(), 'environment.conf.json')),
    ),
  },
`;

    const rulesProp = 'rules: [';
    const endOfFileSequence = '});';

    const babelConfig = this.fs.read(configFile);

    const cfgExtended = babelConfig
      .replace(rulesProp, `${rulesProp}${sassRule}`)
      .replace(endOfFileSequence, `${externals}${endOfFileSequence}`);

    fs.unlinkSync(configFile);
    this.fs.write(configFile, cfgExtended);
  }

  /**
   * Removes the WebpackPwaManifest entry or replaces properties in its declaration in the production
   * Webpack configuration
   */
  _setPWADetails() {
    const { useManifest, name, shortName, backgroundColor, themeColor, description } = this.pwa;
    const configFile = this.destinationPath('internals/webpack/webpack.prod.babel.js');
    const babelProdContents = this.fs.read(configFile);
    const rePWAPlugin = /new WebpackPwaManifest\(\{[\s\S]+?(?=\}\),)\}\),/;
    const multilinePluginRegExp = new RegExp(rePWAPlugin, 'gim');
    let pluginReplace = '';

    if (useManifest) {
      const rePWAProp = /^\s*(name|short_name|description|background_color|theme_color):\s*'(.+)',?$/;
      const [plugin] = babelProdContents.match(multilinePluginRegExp);
      const lines = plugin.match(new RegExp(rePWAProp, 'gim'));
      pluginReplace = plugin;

      lines.forEach(line => {
        const [, prop, value] = line.match(new RegExp(rePWAProp, 'i'));
        const replaced = line.replace(value, () => {
          switch (prop) {
            case 'name':
              return name;
            case 'short_name':
              return shortName;
            case 'background_color':
              return backgroundColor;
            case 'theme_color':
              return themeColor;
            case 'description':
              return description;
            default:
              return '';
          }
        });

        pluginReplace = pluginReplace.replace(line, replaced);
      });
    }

    const babelProdContentsModified = babelProdContents.replace(multilinePluginRegExp, pluginReplace);

    fs.unlinkSync(configFile);
    this.fs.write(configFile, babelProdContentsModified);
  }

  _setDependencies() {
    const dependencies = {
      'amsterdam-stijl': '^3.0.5',
      leaflet: '^1.4.0',
      moment: '^2.24.0',
      proj4: '^2.5.0',
      'react-router-redux': '^5.0.0-alpha.8',
    };

    const devDependencies = {
      'babel-plugin-inline-react-svg': '^0.5.4',
      dyson: '^2.0.3',
      'dyson-generators': '^0.2.0',
      'dyson-image': '^0.2.0',
      'node-sass': '*',
      'npm-run-all': '^4.0.5',
      'sass-loader': '*',
    };

    this._updatePackageJson({ dependencies, devDependencies });
  }

  _setScripts() {
    const scripts = {
      'build:acc': `cross-env NODE_ENV=acceptance webpack --config internals/webpack/webpack.prod.babel.js --color -p --progress --hide-modules --display-optimization-bailout`,
      'build:prod': `cross-env NODE_ENV=production webpack --config internals/webpack/webpack.prod.babel.js --color -p --progress --hide-modules --display-optimization-bailout`,
      'dyson:server': `nodemon --watch test/mock/api --exec babel-node --presets=latest test/mock/api`,
      'dyson:sample': `nodemon --watch test/mock/sample --exec babel-node --presets=latest ./test/mock/sample`,
      'start:dev': 'npm-run-all -p dyson:server start:proxy-dev',
      'start:proxy-dev': `cross-env NODE_ENV=development node server -- --proxyConfig=proxy.conf.dev.js --port=3001`,
      'lint:css': "stylelint './app/**/*.js'",
    };

    this._updatePackageJson({ scripts });
  }

  async _copyTemplateFiles() {
    // first, remove default folders and files to prevent file diff warnings
    await deleteFolderRecursive(this.destinationPath('app/components'));
    await deleteFolderRecursive(this.destinationPath('app/containers'));
    await deleteFolderRecursive(this.destinationPath('app/images'));

    fs.unlinkSync(this.destinationPath('internals/templates/containers/App/tests/selectors.test.js'));
    fs.unlinkSync(this.destinationPath('app/global-styles.js'));
    fs.unlinkSync(this.destinationPath('app/index.html'));
    fs.unlinkSync(this.destinationPath('app/app.js'));
    fs.unlinkSync(this.destinationPath('app/i18n.js'));

    if (this.project.truncateReadme) {
      fs.unlinkSync(this.destinationPath('README.md'));
      const readmeContents = `# ${this.project.seoName}
${this.project.description}
`;
      this.fs.write(this.destinationPath('README.md'), readmeContents);
    }

    const prettierJson = this.fs.readJSON(this.destinationPath('.prettierrc'));
    fs.unlinkSync(this.destinationPath('.prettierrc'));

    this.fs.writeJSON(this.destinationPath('.prettierrc'), { ...prettierJson, printWidth: 120 });

    this.fs.copyTpl(this.templatePath(), this.destinationPath(), {
      jenkinsJob: this.jenkins.job,
      jenkinsPlaybook: this.jenkins.playbook,
      jenkinsProjectId: this.jenkins.projectId,
      language: this.project.language,
      projectName: this.project.name,
      proxyDir: this.project.apiProxyDir,
      seoProjectName: this.project.seoName,
      subdomain: this.project.subdomain,
    });

    this.fs.copy(this.templatePath('.*'), this.destinationPath());

    // The following is a hack to get around the fact that the Yeoman generator copies the template files
    // after the generator has finished running. This asynchronous behaviour prevents pushing the initial
    // commit to Github, because the commit occurs before all files have been written to disk.
    this._writeFiles(this._finish);
  }

  async _finish() {
    const installSuccessful = await this._installDeps();
    let commitSuccessful = true;

    if (installSuccessful) {
      commitSuccessful = await this._autoCommit();
    }

    if (commitSuccessful) {
      this._end();
    }
  }

  _installDeps() {
    if (this.project.installDependencies) {
      this._showBrand();
      this._showInstallSteps(3);

      const npmInstall = spawnSync('npm', ['i', '--no-progress', '--no-optional', '--no-audit']);

      if (npmInstall.status !== 0) {
        return this.prompt([
          {
            name: 'continue',
            type: 'confirm',
            message: 'npm Installation failed. Skip initial commit?',
            default: 'Press any key',
          },
        ]).then(({ confirm }) => confirm);
      }
    }

    return this.github.autoCommit;
  }

  _autoCommit() {
    this._showBrand();
    this._showInstallSteps(4);

    const gitAdd = spawnSync('git', ['add', '.']);
    const gitCommit = spawnSync('git', ['commit', '--no-verify', "-m 'First commit'"]);
    const gitPush = spawnSync('git', ['push', '-u', 'origin', 'master']);

    if (gitAdd.status !== 0 || gitCommit.status !== 0 || gitPush.status !== 0) {
      this._showError('Could not commit. Check your local changes and try again');
      return false;
    }

    return true;
  }

  _end() {
    this._showBrand();
    this._showInstallSteps(5);
  }
};
