const Generator = require('yeoman-generator');
const chalk = require('chalk');
const semverRegex = require('semver-regex');
const fs = require('fs');
const merge = require('deepmerge');
const afs = fs.promises;

const nonEmptyString = value => value.trim().length > 0;

const deleteFolderRecursive = async path => {
  if (fs.existsSync(path)) {
    for (let entry of await afs.readdir(path)) {
      const curPath = path + '/' + entry;

      if ((await afs.lstat(curPath)).isDirectory())
        await deleteFolderRecursive(curPath);
      else await afs.unlink(curPath);
    }
    await afs.rmdir(path);
  }
};

module.exports = class AmsterdamReactBoilerplateGenerator extends Generator {
  _initialCommit() {
    this.spawnCommandSync('git', ['add', '.']);
    this.spawnCommandSync('git', ['commit', "-m 'First commit'"]);
    this.spawnCommandSync('git', ['push', '-u', 'origin', 'master']);
  }

  _showIntro() {
    this.spawnCommandSync('clear');

    this.log(
      chalk.bold.red(`
 X ${chalk.white('Gemeente Amsterdam')}
 X ${chalk.white('react-boilerplate generator')}
 X
    `)
    );

    this.log(
      chalk.white(` Please note that, before you continue, you need to have a repository ready where
 the new amsterdam-react-boilerplate project will be available in.
 The project will be installed in the current working directory
 ${chalk.grey('(' + this.destinationRoot() + ')')}\n`)
    );
  }

  _determineSetupState() {
    // is Github repo?
    if (this.fs.exists('./.git/config')) {
      const gitConfig = this.fs.read('./.git/config');
      const [, user, repository] = gitConfig.match(
        /^\surl = git@github\.com:([^\/]+)\/([^\.]+)\.git$/m
      );

      return this.prompt({
        type: 'confirm',
        name: 'useThisRepo',
        message: `The current folder contains settings for user '${user}' and repository '${repository}'. Do you want to use these?`
      }).then(({ useThisRepo }) => {
        if (!useThisRepo) {
          this.log(
            chalk.red(
              'Project generator cannot continue. Create a different project folder and start over.'
            )
          );
          process.exit(1);
        } else {
          this.github.username = user;
          this.github.repository = repository;
        }
      });
    } else {
      this.log(
        chalk.cyan(
          ' No Github config found, enter Github user and repository name\n'
        )
      );

      return this.prompt([
        {
          name: 'username',
          message: 'User:',
          default: 'janjaap',
          validate: nonEmptyString
        },
        {
          name: 'repository',
          message: 'Repository:',
          default: 'test',
          validate: nonEmptyString
        }
      ]).then(({ username, repository }) => {
        this.github.username = username;
        this.github.repository = repository;
        this.github.url = `git@github.com:${username}/${repository}.git`;
      });
    }
  }

  _getProjectDetails() {
    this.log(chalk.cyan(' Project details\n'));

    return this.prompt([
      {
        name: 'name',
        message: 'Project name:',
        validate: nonEmptyString
      },
      {
        name: 'version',
        message: 'Version:',
        default: this.project.version,
        validate: nonEmptyString
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
        name: 'language',
        message: 'Language (ISO 639-1):',
        default: this.project.language,
        validate: nonEmptyString
      }
    ]).then(({ name, version, description }) => {
      this.project.name = name;
      this.project.version = version;
      this.project.description = description;
    });
  }

  _getJenkinsDetails() {
    this.log(chalk.cyan(' Jenkins details\n'));

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
    this.log(chalk.cyan(' Environment details\n'));

    return this.prompt([
      {
        name: 'subdomain',
        message: 'Subdomain (<sd>.amsterdam.nl):',
        validate: nonEmptyString
      },
      {
        name: 'apiProxyDir',
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

    this.fs.writeJSON(this.destinationPath('package.json'), this.packageJson);
  }

  _setProjectDetails() {
    const { url } = this.github;
    const { version, name, description } = this.project;

    const projectDetails = {
      version,
      name,
      description,
      repository: {
        url
      }
    };

    this._updatePackageJson(projectDetails);
  }

  _setDependencies() {
    const dependencies = {
      'amsterdam-stijl': '^3.0.5',
      'dyson': '^2.0.3',
      'dyson-generators': '^0.2.0',
      'dyson-image': '^0.2.0',
      'npm-run-all': '^4.0.5'
    };

    this._updatePackageJson({ dependencies });
  }

  _setScripts() {
    const scripts = {
      'dyson:server': 'nodemon --watch test/mock/api --exec babel-node --presets=latest test/mock/api',
      'dyson:sample': 'nodemon --watch test/mock/sample --exec babel-node --presets=latest ./test/mock/sample',
      'start:dev': 'npm-run-all -p dyson:server start:proxy-dev',
      'start:proxy-dev': 'cross-env NODE_ENV=development node server -- --proxyConfig=proxy.conf.dev.js --port=3001',
      'build:prod': 'cross-env NODE_ENV=production webpack --config internals/webpack/webpack.prod.babel.js --color -p --progress --hide-modules --display-optimization-bailout',
      'lint:css': "stylelint './app/**/*.js'",
    };

    this._updatePackageJson({ scripts });
  }

  async _copyTemplateFiles() {
    // first, remove default folders and files to prevent file diff warnings
    await deleteFolderRecursive(this.destinationPath('app/components'));
    await deleteFolderRecursive(this.destinationPath('app/containers'));
    await deleteFolderRecursive(this.destinationPath('app/images'));

    fs.unlinkSync(this.destinationPath('app/global-styles.js'));

    this.fs.copyTpl(this.templatePath(), this.destinationPath(), {
      jenkinsJob: this.jenkins.job,
      jenkinsPlaybook: this.jenkins.playbook,
      jenkinsProjectId: this.jenkins.projectId,
      language: this.project.language,
      projectName: this.project.name,
      proxyDir: this.environment.apiProxyDir,
      subdomain: this.environment.subdomain
    });
  }

  initializing() {
    this.github = {
      username: '',
      repository: '',
      url: ''
    };

    this.project = {
      author: 'Datapunt Amsterdam',
      name: '',
      description: '',
      license: 'MPL-2.0',
      version: '0.0.1',
      language: 'nl'
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

    this._showIntro();

    // this._initialCommit();
  }

  configuring() {
    this.log(chalk.cyan('Cloning react-boilerplate/react-boilerplate...'));

    this.spawnCommandSync('git', [
      'clone',
      '--quiet',
      'git@github.com:react-boilerplate/react-boilerplate.git',
      '.'
    ]);

    this.spawnCommandSync('git', [
      'remote',
      'set-url',
      'origin',
      this.github.url
    ]);

    this.packageJson = require(this.destinationPath('package.json'));
  }

  async prompting() {
    await this._determineSetupState();

    this._showIntro();

    await this._getProjectDetails();

    this._showIntro();

    await this._getJenkinsDetails();

    this._showIntro();

    await this._getEnvironmentDetails();
  }

  writing() {
    this._setProjectDetails();
    this._setDependencies();
    this._setScripts();
  }

  end() {
    this._writePackageJson();
    this._copyTemplateFiles();
  }
};
