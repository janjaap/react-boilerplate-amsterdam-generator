/* eslint-disable no-underscore-dangle */
const fs = require('fs');

const validators = require('../app/validators');
const BaseGenerator = require('../base');

const { nonEmptyString } = validators;

/**
 * Setup generator
 *
 * Prompts for Github repo details
 */
module.exports = class PWAGenerator extends BaseGenerator {
  initializing() {
    this.config.set('pwa', {
      name: '',
      shortName: '',
      description: '',
      backgroundColor: '#ffffff',
      themeColor: '#ec0000',
      useManifest: true,
    });
  }

  async prompting() {
    await this._getPWADetails();
  }

  writing() {
    this._writePWADetails();
  }

  async _getPWADetails() {
    this._showBrand();
    this._showSectionTitle(
      'PWA parameters',
      'The input for the parameters below will be used to populate the manifest.json file (production only)',
    );

    const { useManifest } = await this.prompt([
      {
        name: 'useManifest',
        type: 'confirm',
        message: 'Do you want to have a manifest.json file generated?',
        default: true,
      },
    ]);

    if (!useManifest) {
      this.config.set('pwa', { ...this.config.get('pwa'), useManifest: false });
      return;
    }

    const pwa = await this.prompt([
      {
        name: 'name',
        message: 'Name:',
        default: this.project.seoName,
        validate: nonEmptyString,
      },
      {
        name: 'shortName',
        message: 'Short name:',
        default: this.project.name,
        validate: nonEmptyString,
      },
      {
        name: 'description',
        message: 'Description:',
      },
      {
        name: 'backgroundColor',
        message: 'Background color:',
        default: this.pwa.backgroundColor,
        validate: nonEmptyString,
      },
      {
        name: 'themeColor',
        message: 'Theme color:',
        default: this.pwa.themeColor,
        validate: nonEmptyString,
      },
    ]);

    this.config.set('pwa', pwa);
  }

  /**
   * Removes the WebpackPwaManifest entry or replaces properties in its declaration in the production
   * Webpack configuration
   */
  _writePWADetails() {
    const { useManifest, name, shortName, backgroundColor, themeColor, description } = this.pwa;
    const configFile = this.destinationPath('internals/webpack/webpack.prod.babel.js');
    const babelProdContents = this.fs.read(configFile);
    const rePWAPlugin = /new WebpackPwaManifest\(\{[\s\S]+?(?=\}\),)\}\),/;
    const multilinePluginRegExp = new RegExp(rePWAPlugin, 'gim');
    let pluginReplace = '';

    if (useManifest) {
      const rePWAProp = /^\s*(name|short_name|description|background_color|theme_color):\s*'(.+)',?$/;
      const [plugin] = babelProdContents.match(multilinePluginRegExp);
      const lines = plugin.match(new RegExp(rePWAProp, 'gim'));
      pluginReplace = plugin;

      lines.forEach(line => {
        const [, prop, value] = line.match(new RegExp(rePWAProp, 'i'));
        const replaced = line.replace(value, () => {
          switch (prop) {
            case 'name':
              return name;
            case 'short_name':
              return shortName;
            case 'background_color':
              return backgroundColor;
            case 'theme_color':
              return themeColor;
            case 'description':
              return description;
            default:
              return '';
          }
        });

        pluginReplace = pluginReplace.replace(line, replaced);
      });
    }

    const babelProdContentsModified = babelProdContents.replace(multilinePluginRegExp, pluginReplace);

    fs.unlinkSync(configFile);
    this.fs.write(configFile, babelProdContentsModified);
  }
};
