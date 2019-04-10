const Generator = require('yeoman-generator');
const chalk = require('chalk');
const fs = require('fs');
const merge = require('deepmerge');
const util = require('util');
const validators = require('./validators');
const utils = require('./utils');
const exec = require('child_process').execSync;

const { nonEmptyString, noSpacesString, semverRegex } = validators;
const { deleteFolderRecursive } = utils;

module.exports = class App extends Generator {
  async initializing() {
    this.github = {
      username: 'Amsterdam',
      repository: '',
      url: '',
      autoCommit: true
    };

    this.project = {
      author: 'Datapunt Amsterdam',
      name: '',
      seoName: '',
      description: '',
      license: 'MPL-2.0',
      version: '0.0.1',
      language: 'nl',
      installDependencies: true
    };

    this.jenkins = {
      job: '',
      playbook: '',
      projectId: ''
    };

    this.environment = {
      apiProxyDir: '',
      subdomain: 'br-wonen'
    };

    this.packageJson = {};

    this._finish = this._finish.bind(this);

    await this._showIntro();
  }

  async prompting() {
    await this._determineSetupState();

    await this._getProjectDetails();

    await this._getJenkinsDetails();

    await this._getEnvironmentDetails();
  }

  async configuring() {
    this._showBrand();
    this._showInstallSteps(0);

    const { hash, tag, url } = this.github;

    // check out the tag
    this.spawnCommandSync('git', [
      'clone',
      '--branch',
      tag,
      '--single-branch',
      '--quiet',
      'git@github.com:react-boilerplate/react-boilerplate.git',
      '.'
    ]);

    this.spawnCommandSync('git', ['checkout', '-b', 'master']);
    this.spawnCommandSync('git', ['rebase', hash]);
    this.spawnCommandSync('git', ['remote', 'set-url', 'origin', url]);

    this.packageJson = require(this.destinationPath('package.json'));
  }

  writing() {
    this._showBrand();
    this._showInstallSteps(1);

    this._setProjectDetails();
    this._setDependencies();
    this._setScripts();
    this._setWebpackRules();

    this._writePackageJson();
  }

  end() {
    this._showBrand();
    this._showInstallSteps(2);

    this._copyTemplateFiles();
  }

  _showIntro() {
    this._showBrand();

    this.log(
      chalk.white(`
 This generator will prepare a Datapunt project by doing the following:
 - clone the latest tag of the react-boilerplate repository
 - append Datapunt specific dependencies to the package.json
 - copy template files into the project folder and
 - (optionally) push the initial commit and install the dependencies

 Please note that the project will be installed in the current working directory: ${chalk.grey(
   '(' + this.destinationRoot() + ')'
 )}
 The directory needs to be empty so that the base repository can be cloned.
 `)
    );

    return this.prompt([
      {
        name: 'continue',
        type: 'confirm',
        message: 'Continue?'
      }
    ]);
  }

  _showInstallSteps(stepNumber = 0) {
    const steps = [
      'Cloning react-boilerplate/react-boilerplate',
      'Updating package.json and webpack configuration',
      'Copying template files',
      this.project.installDependencies && 'Installing dependencies',
      this.github.autoCommit && 'Pushing initial commit',
      `Installation of project '${this.project.seoName}' complete`
    ].filter(Boolean);

    if (stepNumber > steps.length - 1) {
      stepNumber -= 1;
    }

    this.log(`
${steps
  .map((step, index) => {
    const stepLine = ` ${index + 1}. ${step}`;
    let color = index === stepNumber ? chalk.yellow : chalk.dim.yellow;

    // last line will be green
    if (index === steps.length - 1) {
      color = index === stepNumber ? chalk.green : chalk.dim.green;
    }

    return color(stepLine);
  })
  .join('\n')}
`);
  }

  _showBrand() {
    console.clear();

    this.log(
      chalk.bold.red(`
 X ${chalk.white('Gemeente Amsterdam')}
 X ${chalk.reset.italic.white('react-boilerplate generator')}
 X`)
    );
  }

  _showSectionTitle(title, caption) {
    const lines = [chalk.cyan(`\n ${title}`), caption && chalk.reset.italic(` ${caption}\n`)].filter(Boolean);

    this.log(lines.join('\n'));
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
      'Credentials for the repository in which the newly created project will be stored'
    );

    await this.prompt([
      {
        name: 'useRepo',
        type: 'confirm',
        message:
          'The generator can automatically set the correct repository for you.\n  Is there a repo you want to use for the new project?'
      }
    ]).then(({ useRepo }) => {
      if (useRepo) {
        return this.prompt([
          {
            name: 'repository',
            message: 'Repository name:',
            validate: nonEmptyString
          },
          {
            name: 'username',
            message: 'Github user/account name:',
            default: this.github.username,
            validate: nonEmptyString
          },
          {
            name: 'autoCommit',
            type: 'confirm',
            message:
              'The generator can push the initial commit to the repository for you.\n  Do you want the generator to do this?',
            default: this.github.autoCommit
          }
        ]).then(({ username, repository, autoCommit }) => {
          this.github.username = username;
          this.github.repository = repository;
          this.github.autoCommit = autoCommit;
          this.github.url = `git@github.com:${username}/${repository}.git`;
        });
      }
    });

    // get the latest tag
    const listTags = 'git ls-remote --tags --quiet git@github.com:react-boilerplate/react-boilerplate.git | tail -5';
    const output = await exec(listTags)
      .toString()
      .trim();

    const commitsAndTags = output.match(/^([^\s]{40})\s*refs\/tags\/(.+)\s*$/gim);
    const choices = commitsAndTags.reverse().map(line => {
      const [, hash, tag] = line.match(/^([^\s]{40})\s*refs\/tags\/(.+)\s*$/);

      return {
        hash,
        tag
      };
    });

    await this.prompt([
      {
        name: 'tag',
        type: 'list',
        message: 'Choose the react-boilerplate tag you want to base your project on:',
        choices: choices.map(({ tag }) => tag)
      }
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
      'Will be used to populate package.json and other template files with the appropriate values'
    );

    return this.prompt([
      {
        name: 'name',
        message: 'Project name (lowercase, no spaces):',
        validate: noSpacesString
      },
      {
        name: 'seoName',
        message: 'Project title (used for SEO, document title):',
        validate: nonEmptyString
      },
      {
        name: 'version',
        message: 'Version:',
        default: this.project.version,
        validate: semverRegex
      },
      {
        name: 'description',
        message: 'Description:'
      },
      {
        name: 'author',
        message: 'Author',
        default: this.project.author
      },
      {
        name: 'license',
        message: 'License:',
        default: this.project.license
      },
      {
        name: 'language',
        message: 'Language (ISO 639-1):',
        default: this.project.language,
        validate: nonEmptyString
      },
      {
        name: 'installDependencies',
        type: 'confirm',
        message: "Would you like the generator to run `npm install` after it's done generating the project?",
        default: true
      }
    ]).then(({ name, seoName, license, author, version, description, installDependencies }) => {
      this.project.name = name;
      this.project.seoName = seoName;
      this.project.author = author;
      this.project.license = license;
      this.project.version = version;
      this.project.description = description;
      this.project.installDependencies = installDependencies;
    });
  }

  _getJenkinsDetails() {
    this._showBrand();
    this._showSectionTitle('Jenkinsfile parameters', 'Required for configuring deployment');

    return this.prompt([
      {
        name: 'job',
        message: 'Job name:',
        validate: nonEmptyString
      },
      {
        name: 'playbook',
        message: 'Playbook:',
        validate: nonEmptyString
      },
      {
        name: 'projectId',
        message: 'Project ID:',
        validate: nonEmptyString
      }
    ]).then(({ job, playbook, projectId }) => {
      this.jenkins.job = job;
      this.jenkins.playbook = playbook;
      this.jenkins.projectId = projectId;
    });
  }

  _getEnvironmentDetails() {
    this._showBrand();
    this._showSectionTitle('Environment parameters');

    return this.prompt([
      {
        name: 'subdomain',
        message: 'Subdomain (<subdomain>.amsterdam.nl):',
        default: `data.${this.project.name}`,
        validate: nonEmptyString
      },
      {
        name: 'apiProxyDir',
        default: this.project.name,
        message: 'API proxy dir (acc.data.amsterdam.nl/<dir>):'
      }
    ]).then(({ subdomain, apiProxyDir }) => {
      this.environment.apiProxyDir = apiProxyDir;
      this.environment.subdomain = subdomain;
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
        url
      }
    };

    this._updatePackageJson(projectDetails);
  }

  _setWebpackRules() {
    const configFile = this.destinationPath('internals/webpack/webpack.base.babel.js');

    const sassRule = {
      test: /\.scss$/,
      use: ['style-loader', 'css-loader', 'sass-loader']
    };

    const externals = {
      globalConfig: "JSON.stringify(require(path.resolve(process.cwd(),'environment.conf.json')))",
    };

    const ruleAsString = util.inspect(sassRule);
    const rulesProp = 'rules: [';

    const externalsAsString = util
      .inspect(externals)
      .replace(/\\'/g, '"') // replace escaped quotes
      .replace(/'/g, '') // remove surrounding quotes
      .replace(/"/g, "'"); // turn double quotes into single quotes
    const endOfFileSequence = '});';

    const babelConfig = this.fs.read(configFile);

    const cfgExtended = babelConfig
      .replace(rulesProp, `${rulesProp}\n${ruleAsString},\n`)
      .replace(endOfFileSequence, `/* eslint-disable global-require */ \n\texternals:\n\t\t${externalsAsString}\n${endOfFileSequence}`);

    fs.unlinkSync(configFile);
    this.fs.write(configFile, cfgExtended);
  }

  _setDependencies() {
    const dependencies = {
      'amsterdam-stijl': '^3.0.5',
      leaflet: '^1.4.0',
      moment: '^2.24.0',
      proj4: '^2.5.0',
      'react-router-redux': '^5.0.0-alpha.8'
    };

    const devDependencies = {
      dyson: '^2.0.3',
      'dyson-generators': '^0.2.0',
      'dyson-image': '^0.2.0',
      'node-sass': '*',
      'npm-run-all': '^4.0.5',
      'sass-loader': '*'
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
      'lint:css': "stylelint './app/**/*.js'"
    };

    this._updatePackageJson({ scripts });
  }

  async _copyTemplateFiles() {
    // first, remove default folders and files to prevent file diff warnings
    await deleteFolderRecursive(this.destinationPath('app/components'));
    await deleteFolderRecursive(this.destinationPath('app/containers'));
    await deleteFolderRecursive(this.destinationPath('app/images'));

    fs.unlinkSync(this.destinationPath('app/global-styles.js'));
    fs.unlinkSync(this.destinationPath('app/index.html'));
    fs.unlinkSync(this.destinationPath('app/app.js'));
    fs.unlinkSync(this.destinationPath('.prettierrc'));
    this.fs.write(this.destinationPath('.prettierrc'), JSON.stringify({}));

    this.fs.copyTpl(this.templatePath(), this.destinationPath(), {
      jenkinsJob: this.jenkins.job,
      jenkinsPlaybook: this.jenkins.playbook,
      jenkinsProjectId: this.jenkins.projectId,
      language: this.project.language,
      projectName: this.project.name,
      proxyDir: this.environment.apiProxyDir,
      seoProjectName: this.project.seoName,
      subdomain: this.environment.subdomain
    });

    // The following is a hack to get around the fact that the Yeoman generator copies the template files
    // after the generator has stopped running. This asynchronous behaviour prevents pushing the initial
    // commit to Github, because the commit occurs before all files have been written to disk.
    this._writeFiles(this._finish);
  }

  _initialCommit() {
    this.spawnCommandSync('git', ['add', '.']);
    this.spawnCommandSync('git', ['commit', "-m 'First commit'"]);
    this.spawnCommandSync('git', ['push', '-u', 'origin', 'master']);
  }

  _finish() {
    this._installDeps(() => {
      this._autoCommit(() => {
        this._end();
      });
    });
  }

  _installDeps(cb) {
    if (this.project.installDependencies) {
      this._showBrand();
      this._showInstallSteps(3);

      this.spawnCommand('npm', [
        'i',
        '--no-progress',
        '--no-optional',
        '--no-audit'
      ]).on('close', (code, signal) => {
        if (code === 0) {
          cb();
        }
      });
    } else {
      cb();
    }
  }

  _autoCommit(cb) {
    if (this.github.autoCommit) {
      this._showBrand();
      this._showInstallSteps(4);

      this._initialCommit();
    }

    cb();
  }

  _end() {
    this._showBrand();
    this._showInstallSteps(5);
  }
};
