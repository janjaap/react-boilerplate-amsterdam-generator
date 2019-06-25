/* eslint-disable no-underscore-dangle */
const fetch = require('node-fetch');
const fs = require('fs');

const BaseGenerator = require('../base');

/**
 * Setup generator
 *
 * Prompts for Github repo details
 */
module.exports = class DependenciesGenerator extends BaseGenerator {
  async prompting() {
    await this._selectDependencies();
  }

  writing() {
    this._writeDependencies();
  }

  async _selectDependencies() {
    console.log(this.config.get('project'));
    const choices = ['amsterdam-amaps', 'amsterdam-stijl'];
    const { dependencies, useSass } = await this.prompt([
      {
        name: 'dependencies',
        type: 'checkbox',
        message: 'Select which (run-time) dependencies you want to have installed:',
        choices,
      },
      {
        name: 'useSass',
        type: 'confirm',
        message: 'Do you want SASS support for this project?',
        default: true,
      },
    ]);

    const runtimeDependencies = dependencies.length ? this._fetchDepenenciesVersion(dependencies) : [];
    const devDependencies = useSass ? this._fetchDepenenciesVersion(['node-sass', 'sass-loader']) : [];
    const project = this.config.get('project');

    this.config.set('project', { ...project, useSass, runtimeDependencies, devDependencies });
  }

  /**
   *
   * @param {String[]} dependencies - list of package names
   * @param {Boolean} [useCaretMatcher=true] - when false, will set explicit dependency version as opposed to minor version match
   */
  async _fetchDepenenciesVersion(dependencies, useCaretMatcher = true) {
    const depsObj = {};

    // eslint-disable-next-line no-restricted-syntax
    for (const name of dependencies) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const packageDetails = await fetch(`https://api.npms.io/v2/package/${name}`).then(response => response.json());

        if (packageDetails) {
          const {
            collected: {
              metadata: { version },
            },
          } = packageDetails;

          // eslint-disable-next-line no-param-reassign
          depsObj[name] = useCaretMatcher ? `^${version}` : version;
        }
      } catch (error) {
        // eslint-disable-next-line no-param-reassign
        depsObj[name] = '*';
      }
    }

    return depsObj;
  }

  /**
   * Appends Enzyme configuration to Jest setup files; react-boilerplate doesn't use Enzyme anymore since
   * version 4.0
   */
  _writeJestConfig() {
    const configFile = this.destinationPath('jest.config.js');
    const configFileContents = this.fs.read(configFile);
    const reSetupFiles = /(setupFiles:\s*\[[^[]+)(\],)/;
    const enzymeSetup = "'<rootDir>/internals/testing/enzyme-setup.js'";
    const configWithEnzymeSetup = configFileContents.replace(reSetupFiles, `$1, ${enzymeSetup}$2`);

    fs.unlinkSync(configFile);
    this.fs.write(configFile, configWithEnzymeSetup);
  }

  /**
   * Adding Amsterdam-specific dependencies
   * Using Dyson as a API proxy, Enzyme for testing, react-router-redux for navigation, scss for styling and leaflet for map
   * layers.
   */
  _writeDependencies() {
    const dependencies = {
      ...this.project.runtimeDependencies,
      leaflet: '^1.4.0',
      proj4: '^2.5.0',
    };

    const devDependencies = {
      ...this.project.devDependencies,
      'babel-plugin-inline-react-svg': '^0.5.4',
      'dyson-generators': '^0.2.0',
      'dyson-image': '^0.2.0',
      'npm-run-all': '^4.0.5',
      dyson: '^2.0.3',
    };

    // applying a different set of dependencies for the react-boilerplate that contains backwards
    // incompatible changes
    if (this.github.tag.version.major === 4) {
      devDependencies.enzyme = '^3.9.0';
      devDependencies['enzyme-adapter-react-16'] = '^1.2.0';
      devDependencies['enzyme-to-json'] = '^3.3.5';

      this._writeJestConfig();
    }

    this._updatePackageJson({ dependencies, devDependencies });
  }
};
