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
  initializing() {
    this.config.set('jenkins', {
      job: '',
      playbook: '',
      projectId: '',
    });
  }

  async prompting() {
    await this._getJenkinsDetails();
  }

  async _getJenkinsDetails() {
    this._showBrand();
    this._showSectionTitle('Jenkinsfile parameters', 'Required for configuring deployment');

    const projectCfg = this.config.get('project');

    const jenkins = await this.prompt([
      {
        name: 'job',
        message: 'Job name:',
        validate: nonEmptyString,
        default: projectCfg.name,
      },
      {
        name: 'playbook',
        message: 'Playbook:',
        validate: nonEmptyString,
        default: projectCfg.name,
      },
      {
        name: 'projectId',
        message: 'Project ID:',
        validate: nonEmptyString,
        default: projectCfg.name,
      },
    ]);

    this.config.set('jenkins', jenkins);
  }
};
