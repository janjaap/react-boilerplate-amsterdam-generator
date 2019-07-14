/* eslint-disable no-underscore-dangle */
const fetch = require('node-fetch');
const merge = require('deepmerge');

const BaseGenerator = require('../base');

/**
 * Setup generator
 *
 * Prompts for Github repo details
 */
module.exports = class DependenciesGenerator extends BaseGenerator {
  async writing() {
    await this._writeDependencies();
  }

  /**
   * Loops through a list of NPM package names and retrieves their latest version. If a version cannot be found, asterisk is used.
   *
   * @param {String[]} dependencies - list of package names
   * @param {Boolean} [useCaretMatcher=true] - when false, will set explicit dependency version as opposed to minor version match
   */
  async _fetchDependenciesVersion(dependencies, useCaretMatcher = true) {
    const depsObj = {};

    // disabling linter; using forEach doesn't work with await construct
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

          depsObj[name] = useCaretMatcher ? `^${version}` : version;
        }
      } catch (error) {
        depsObj[name] = '*';
      }
    }

    return depsObj;
  }

  /**
   * Adding Amsterdam-specific dependencies
   * Using Dyson as a API proxy, Enzyme for testing, react-router-redux for navigation, scss for styling and leaflet for map
   * layers.
   */
  async _writeDependencies() {
    const projectCfg = this.config.get('project');
    const githubCfg = this.config.get('github');

    const dependencies = merge(
      projectCfg.dependencies,
      await this._fetchDependenciesVersion([
        '@datapunt/asc-assets',
        '@datapunt/asc-ui',
        '@sentry/browser',
        'amsterdam-amaps',
        'leaflet',
        'proj4',
        'react-router-redux',
      ]),
    );

    // applying a different set of dependencies for the react-boilerplate that contains backwards
    // incompatible changes
    const enzymeDeps =
      githubCfg.tag.version.major >= 4
        ? await this._fetchDependenciesVersion(['enzyme', 'enzyme-adapter-react-16', 'enzyme-to-json'])
        : {};

    const adamDevDeps = await this._fetchDependenciesVersion([
      '@svgr/webpack',
      'babel-plugin-inline-react-svg',
      'dyson-generators',
      'dyson-image',
      'dyson',
      'jest-localstorage-mock',
      'node-sass',
      'npm-run-all',
      'redux-saga-test-plan',
      'sass-loader',
    ]);

    const devDependencies = merge.all([projectCfg.devDependencies, adamDevDeps, enzymeDeps]);
    const packageJson = this.config.get('packageJson');
    const merged = merge(packageJson, { dependencies, devDependencies });

    this.config.set('packageJson', merged);
  }
};
