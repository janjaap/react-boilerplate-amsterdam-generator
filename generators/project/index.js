/* eslint-disable no-underscore-dangle */
const chalk = require('chalk');
const merge = require('deepmerge');

const BaseGenerator = require('../base');
const validators = require('../app/validators');
const filters = require('../app/filters');

const { toLowerCase } = filters;
const { nonEmptyString, noSpacesString, semverRegex, languageCode, subdomain } = validators;

/**
 * Setup generator
 *
 * Prompts for Github repo details
 */
module.exports = class ProjectGenerator extends BaseGenerator {
  initializing() {
    this.config.set('project', {
      apiProxyDir: '',
      author: 'Datapunt Amsterdam',
      dependencies: {},
      description: '',
      devDependencies: {},
      installDependencies: true,
      language: 'nl',
      license: 'MPL-2.0',
      name: '',
      seoName: '',
      subdomain: '',
      truncateReadme: true,
      useSass: true,
      version: '0.0.1',
    });
  }

  async prompting() {
    await this._getProjectDetails();
  }

  writing() {
    this._writeProjectDetails();
  }

  async _getProjectDetails() {
    this._showBrand();
    this._showSectionTitle(
      'Project parameters',
      'Used for package.json properties, constants values and template files value replacements',
    );

    const projectCfg = this.config.get('project');

    const project = await this.prompt([
      {
        name: 'name',
        message: `Project name ${chalk.reset.dim.white('(lowercase, no spaces)')}:`,
        validate: noSpacesString,
        filter: toLowerCase,
      },
      {
        name: 'seoName',
        message: `Project title ${chalk.reset.dim.white('(SEO)')}:`,
        validate: nonEmptyString,
      },
      {
        name: 'version',
        message: 'Version:',
        default: projectCfg.version,
        validate: semverRegex,
      },
      {
        name: 'description',
        message: 'Description:',
      },
      {
        name: 'author',
        message: 'Author',
        default: projectCfg.author,
      },
      {
        name: 'license',
        message: 'License:',
        default: projectCfg.license,
      },
      {
        name: 'language',
        message: `Language ${chalk.reset.dim.white('(ISO 639-1)')}:`,
        default: projectCfg.language,
        validate: languageCode,
        filter: toLowerCase,
      },
      {
        name: 'subdomain',
        message: `Subdomain ${chalk.reset.dim.white('(<subdomain>.amsterdam.nl)')}:`,
        validate: subdomain,
        filter: toLowerCase,
      },
      {
        name: 'apiProxyDir',
        message: `API proxy dir ${chalk.reset.dim.white('(acc.data.amsterdam.nl/<dir>)')}:`,
        filter: toLowerCase,
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
    ]);

    this.config.set('project', project);
  }

  _writeProjectDetails() {
    const projectCfg = this.config.get('project');
    const packageJsonCfg = this.config.get('packageJson');
    const githubCfg = this.config.get('github');
    const { url } = githubCfg;
    const repository = {
      url,
    };

    const {
      apiProxyDir,
      seoName,
      installDependencies,
      useSass,
      subdomain: subDomain,
      truncateReadme,
      ...merged
    } = merge(packageJsonCfg, {
      ...projectCfg,
      repository,
    });

    this.config.set('packageJson', merged);
  }
};
