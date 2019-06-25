/* eslint-disable no-underscore-dangle */
const chalk = require('chalk');

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
    const projectDetails = {
      ...this.config.get('project'),
      repository: {
        url: this.github.url,
      },
    };

    this._updatePackageJson(projectDetails);
  }
};
