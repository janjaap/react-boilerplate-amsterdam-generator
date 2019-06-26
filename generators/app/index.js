/* eslint-disable no-underscore-dangle */
const chalk = require('chalk');
const fs = require('fs');
const merge = require('deepmerge');
const childProces = require('child_process');

const BaseGenerator = require('../base');
const utils = require('./utils');

const { spawnSync } = childProces;
const { deleteFolderRecursive } = utils;

module.exports = class App extends BaseGenerator {
  async initializing() {
    this.config.set('packageJson', {});

    this.composeWith(require.resolve('../setup'));
    this.composeWith(require.resolve('../dependencies'));
    this.composeWith(require.resolve('../project'));
    this.composeWith(require.resolve('../jenkins'));
    this.composeWith(require.resolve('../pwa'));

    // binding async methods
    this._finish = this._finish.bind(this);
    this._autoCommit = this._autoCommit.bind(this);

    await this._showIntro();
  }

  async prompting() {
    // noop
  }

  configuring() {
    this._showBrand();
    this._showInstallSteps(0);

    const {
      tag: { tagStr },
      url,
    } = this.config.get('github');

    // check out the tag
    const gitClone = spawnSync('git', [
      'clone',
      '--branch',
      tagStr,
      '--single-branch',
      '--quiet',
      'git@github.com:react-boilerplate/react-boilerplate.git',
      '.',
    ]);

    if (gitClone.status !== 0) {
      this._showError('Could not clone the base repository', true);
    }

    spawnSync('rm', ['-rf', '.git']);
    spawnSync('git', ['init']);
    spawnSync('git', ['remote', 'add', 'origin', url]);

    // eslint-disable-next-line global-require
    this.config.set('packageJson', require(this.destinationPath('package.json')));
  }

  writing() {
    this._showBrand();
    this._showInstallSteps(1);

    this._setScripts();
    this._writeWebpackRules();
    this._writePackageJson();
  }

  end() {
    this._showBrand();
    this._showInstallSteps(2);

    this._copyTemplateFiles();
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

  _writePackageJson() {
    // remove first to prevent diff conflict
    if (fs.existsSync(this.destinationPath('package.json'))) {
      fs.unlinkSync(this.destinationPath('package.json'));
    }

    return this.fs.writeJSON(this.destinationPath('package.json'), this.config.get('packageJson'));
  }

  /**
   * Applies rules for SCSS parsing and adds env var configuration to the base Webpack configuration file
   */
  _writeWebpackRules() {
    const configFile = this.destinationPath('internals/webpack/webpack.base.babel.js');

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

    let cfgExtended = babelConfig.replace(endOfFileSequence, `${externals}${endOfFileSequence}`);

    const projectCfg = this.config.get('project');

    if (projectCfg.useSass) {
      /* eslint-disable no-useless-escape */
      const sassRule = `
        {
          test: /\.scss$/,
          use: ['style-loader', 'css-loader', 'sass-loader'],
        },
`;
      /* eslint-ensable no-useless-escape */

      cfgExtended = cfgExtended.replace(rulesProp, `${rulesProp}${sassRule}`);
    }

    fs.unlinkSync(configFile);
    this.fs.write(configFile, cfgExtended);
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

    const packageJsonCfg = this.config.get('packageJson');
    const merged = merge(packageJsonCfg, { scripts });

    this.config.set('packageJson', merged);
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
    fs.unlinkSync(this.destinationPath('server/index.js'));
    fs.unlinkSync(this.destinationPath('server/logger.js'));

    const project = this.config.get('project');
    const jenkins = this.config.get('jenkins');

    if (project.truncateReadme) {
      fs.unlinkSync(this.destinationPath('README.md'));
      const readmeContents = `# ${project.seoName}
${project.description}
`;
      this.fs.write(this.destinationPath('README.md'), readmeContents);
    }

    const prettierJson = this.fs.readJSON(this.destinationPath('.prettierrc'));
    fs.unlinkSync(this.destinationPath('.prettierrc'));

    this.fs.writeJSON(this.destinationPath('.prettierrc'), { ...prettierJson, printWidth: 120 });

    this.fs.copyTpl(this.templatePath(), this.destinationPath(), {
      jenkinsJob: jenkins.job,
      jenkinsPlaybook: jenkins.playbook,
      jenkinsProjectId: jenkins.projectId,
      language: project.language,
      projectName: project.name,
      proxyDir: project.apiProxyDir,
      seoProjectName: project.seoName,
      subdomain: project.subdomain,
    });

    this.fs.copy(this.templatePath('.*'), this.destinationPath());

    // The following is a hack to get around the fact that the Yeoman generator copies the template files
    // after the generator has finished running. This asynchronous behaviour prevents pushing the initial
    // commit to Github, because the commit occurs before all files have been written to disk.
    this._writeFiles(this._finish);
  }
};
