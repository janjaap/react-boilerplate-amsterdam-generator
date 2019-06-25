/* eslint-disable no-underscore-dangle */
const BaseGenerator = require('../base');
const validators = require('../app/validators');

const { nonEmptyString } = validators;

/**
 * Setup generator
 *
 * Prompts for Github repo details
 */
module.exports = class JenkinsGenerator extends BaseGenerator {
  async prompting() {
    await this._getJenkinsDetails();
  }

  async _getJenkinsDetails() {
    this._showBrand();
    this._showSectionTitle('Jenkinsfile parameters', 'Required for configuring deployment');

    const jenkins = await this.prompt([
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
    ]);

    this.jenkins = jenkins;
  }
};
