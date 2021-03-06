/* eslint-disable no-underscore-dangle */
const logSymbols = require('log-symbols');
const chalk = require('chalk');
const fs = require('fs');
const childProces = require('child_process');
const fetch = require('node-fetch');

const validators = require('../app/validators');
const BaseGenerator = require('../base');

const { execSync, spawnSync } = childProces;
const { nonEmptyString, githubUsername } = validators;

/**
 * Setup generator
 *
 * Prompts for Github repo details
 */
module.exports = class SetupGenerator extends BaseGenerator {
  initializing() {
    this.reEnterGithubCreds = false;

    this.config.set('github', {
      autoCommit: true,
      repository: '',
      url: '',
      username: 'Amsterdam',
      tag: {
        tagStr: '',
        version: {
          major: 0,
          minor: 0,
          patch: 0,
        },
      },
    });
  }

  async prompting() {
    await this._determineSetupState();
  }

  async _determineSetupState() {
    this._showBrand();

    const files = fs.readdirSync(this.destinationRoot());
    if (files.length) {
      this.log(chalk.bold.red('Run the generator in an empty folder'));
      process.exit(1);
    }

    this._showSectionTitle(
      'Github user and repository name',
      'Credentials for the repository in which the newly created project will be stored',
    );

    let useRepo = true;

    if (!this.reEnterGithubCreds) {
      ({ useRepo } = await this.prompt([
        {
          name: 'useRepo',
          type: 'confirm',
          message: 'Is there an existing repo you want to use for the new project?',
          when: !this.reEnterGithubCreds,
          default: true,
        },
      ]));
    }

    const githubCfg = this.config.get('github');

    if (useRepo) {
      const github = await this.prompt([
        {
          name: 'repository',
          message: 'Repository name:',
          validate: nonEmptyString,
        },
        {
          name: 'username',
          message: 'Github user/account name:',
          default: githubCfg.username,
          validate: githubUsername,
        },
        {
          name: 'autoCommit',
          type: 'confirm',
          message: 'Do you want the generator to push the initial commit?',
          default: githubCfg.autoCommit,
        },
      ]);

      // using stdout to reset the cursor and overwrite the printed line
      process.stdout.write(`  Checking for repository...\r`);

      const { username, repository } = github;
      const repoEndpoint = `https://api.github.com/repos/${username}/${repository}`;
      const response = await fetch(repoEndpoint);
      const responseJson = await response.json();
      const { id, git_url: gitURL, ssh_url: sshURL } = responseJson;

      const githubSSHTest = spawnSync('ssh', ['-T', 'git@github.com']);
      const sshEnabled = /successfully authenticated/.test(githubSSHTest.output.toString());

      if (!id) {
        this.log(`  Checking for repository... ${logSymbols.error}\n  Repository could not be found`);

        const { changeInput } = await this.prompt([
          {
            name: 'changeInput',
            type: 'confirm',
            message: 'Re-enter user and repository name?',
          },
        ]);

        if (changeInput) {
          this.reEnterGithubCreds = true;
          await this._determineSetupState();
        }
      } else {
        this.log(`  Checking for repository... ${logSymbols.success}`);

        const githubUrl = sshEnabled ? sshURL : gitURL;
        this.config.set('github', { ...github, url: githubUrl });

        await this._getBoilerplateTags();
      }
    } else {
      this.config.set('github', { ...githubCfg, autoCommit: false });

      await this._getBoilerplateTags();
    }
  }

  /**
   * Gets latest five tags from Github repository
   */
  async _getBoilerplateTags() {
    process.stdout.write(`  Getting react-boilerplate tags...\r`);

    // get the latest tags
    const listTags = 'git ls-remote --tags --quiet git@github.com:react-boilerplate/react-boilerplate.git | tail -5';
    const output = await execSync(listTags)
      .toString()
      .trim();

    this.log(`  Getting react-boilerplate tags... ${logSymbols.success}`);

    const reTagRefs = /^([^\s]{40})\s*refs\/tags\/(.+)\s*$/;
    const commitsAndTags = output.match(new RegExp(reTagRefs, 'gim'));
    const choices = commitsAndTags
      .reverse()
      .map(line => {
        const [, , tagStr] = line.match(reTagRefs);
        const [major, minor, patch] = tagStr.match(/\d/g);

        return {
          tagStr,
          version: {
            major: Number.parseInt(major, 10),
            minor: Number.parseInt(minor, 10),
            patch: Number.parseInt(patch, 10),
          },
        };
      })
      .filter(Boolean)
      .slice(0, 5);

    const { bpTag } = await this.prompt([
      {
        name: 'bpTag',
        type: 'list',
        message: 'Choose the react-boilerplate tag you want to base your project on:',
        choices: choices.map(item => item.tagStr),
      },
    ]);

    const githubCfg = this.config.get('github');
    const tag = choices.find(({ tagStr }) => tagStr === bpTag);

    this.config.set('github', { ...githubCfg, tag });
  }
};
