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
 X                                       X
 X ${chalk.white('Amsterdam react-boilerplate generator')} X
 X                                       X
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
      // {
      //   name: 'projectId',
      //   message: 'Project ID:',
      //   validate: nonEmptyString
      // }
    ]).then(({ subdomain, apiProxyDir }) => {
      this.environment.apiProxyDir = apiProxyDir;
      this.environment.subdomain = subdomain;
    });
  }

  // async _getFeatures() {
  //   this.log(
  //     chalk.cyan(' Project features (deselect the ones you do not need)\n')
  //   );

  //   const { features } = await this.prompt([
  //     {
  //       type: 'checkbox',
  //       name: 'features',
  //       message: 'Features:',
  //       pageSize: 10,
  //       highlight: false,
  //       choices: this.features,
  //     }
  //   ]);

  //   this.featuresToBeRemoved = this.features.filter(feature => !features.includes(feature));
  // }

  _updatePackageJson(values) {
    // this.log(this.packageJson);
    this.packageJson = merge(this.packageJson, values);
  }

  _writePackageJson() {
    // remove first to prevent conflict dialog from showing
    if (fs.existsSync(this.destinationPath('package.json'))) {
      fs.unlinkSync(this.destinationPath('package.json'));
    }

    this.fs.writeJSON(this.destinationPath('package.json'), this.packageJson);
  }

  // _removeI18n() {

  // }

  // _removeReduxSaga() {

  // }

  // _removeReselect() {

  // }

  // _removeOfflineAccess() {
  //   // delete the offline-plugin from the package.json
  //   // remove the import of the plugin in app.js
  //   // remove the plugin from the webpack.prod.babel.js.

  //   const appMain = this.destinationPath('src/app.js');
  //   const appMainContents = this.fs.read(appMain);
  //   const lineCommented = appMainContents.replace(/(^\s*require\('offline-plugin.+)$/gm, '//$1');

  //   fs.unlinkSync(appMain);
  //   this.fs.write(appMain, lineCommented);

  //   const wpProdConfig = this.destinationPath('internals/webpack/webpack.prod.babel.js');
  //   const wpProdConfigContents = this.fs.read(wpProdConfig);
  //   const packageNameReplaced = wpProdConfigContents.replace('offline-plugin', 'noop-webpack-plugin');

  //   fs.unlinkSync(wpProdConfig);
  //   this.fs.write(wpProdConfig, packageNameReplaced);

  //   const { devDependencies } = this.packageJson;
  //   delete devDependencies['offline-plugin'];
  //   devDependencies['noop-webpack-plugin'] = '1.0.1';

  //   this._updatePackageJson({ devDependencies });
  // }

  // _removePerformantWebFontLoading() {

  // }

  // _removeImageOptimization() {

  // }

  // _removeSanitizeCSS() {

  // }

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

  _copyTemplateFiles() {
    // first, remove the default components, containers and images
    deleteFolderRecursive(this.destinationPath('app/components'));
    deleteFolderRecursive(this.destinationPath('app/containers'));
    deleteFolderRecursive(this.destinationPath('app/images'));

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

  // _removeFeatures() {
  //   const { featuresToBeRemoved } = this;

  //   if (featuresToBeRemoved.includes('i18n')) {
  //     this._removeI18n();
  //   }
  //   if (featuresToBeRemoved.includes('redux-saga')) {
  //     this._removeReduxSaga();
  //   }
  //   if (featuresToBeRemoved.includes('reselect')) {
  //     this._removeReselect();
  //   }
  //   if (featuresToBeRemoved.includes('offline access')) {
  //     this._removeOfflineAccess();
  //   }
  //   if (featuresToBeRemoved.includes('performant web font loading')) {
  //     this._removePerformantWebFontLoading();
  //   }
  //   if (featuresToBeRemoved.includes('image optimization')) {
  //     this._removeImageOptimization();
  //   }
  //   if (featuresToBeRemoved.includes('sanitize.css')) {
  //     this._removeSanitizeCSS();
  //   }
  // }

  initializing() {
    // this.log('\ninitializing\n');
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

    // this.featuresToBeRemoved = [];

    // this.features = [
    //   'i18n',
    //   'redux-saga',
    //   'reselect',
    //   'offline access',
    //   // 'add to homescreen functionality',
    //   // 'performant web font loading',
    //   // 'image optimization',
    //   // 'sanitize.css'
    // ];

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
  }

  end() {
    this._writePackageJson();
    this._copyTemplateFiles();
  }
};
