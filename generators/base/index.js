/* eslint-disable no-underscore-dangle */
const Generator = require('yeoman-generator');
const logSymbols = require('log-symbols');
const chalk = require('chalk');
const childProces = require('child_process');

const { spawnSync } = childProces;

module.exports = class BaseGenerator extends Generator {
  _showError(error, bail = false) {
    this._showBrand();
    this.log(
      chalk.bold.red(`
 ${error}
`),
    );

    if (bail) {
      process.exit(1);
    }
  }

  _showInstallSteps(stepNumber = 0) {
    const projectCfg = this.config.get('project');
    const githubCfg = this.config.get('github');

    const steps = [
      'Cloning react-boilerplate/react-boilerplate',
      'Updating package.json and webpack configuration',
      'Copying template files',
      projectCfg.installDependencies && 'Installing dependencies',
      githubCfg.autoCommit && 'Running linter and pushing initial commit',
      `Installation of project '${projectCfg.seoName}' complete`,
    ].filter(Boolean);

    let stepNr = stepNumber;

    if (stepNumber > steps.length - 1) {
      stepNr -= 1;
    }

    const stepLines = steps
      .map((step, index) => {
        const complete = index < stepNumber ? ` ${chalk(logSymbols.success)}` : '...';
        const stepLine = ` ${index + 1}. ${step}${complete}`;
        let color = index === stepNr ? chalk.yellow : chalk.dim.yellow;

        // last line will be green
        if (index === steps.length - 1) {
          color = index === stepNr ? chalk.green : chalk.dim.green;
        }

        return color(stepLine);
      })
      .join('\n');

    this.log(`\n${stepLines}`);
  }

  _showBrand() {
    this.spawnCommandSync('clear');

    this.log(
      chalk.bold.red(`
 X ${chalk.white('Gemeente Amsterdam')}
 X ${chalk.reset.italic.white('react-boilerplate generator')}
 X`),
    );
  }

  _showSectionTitle(title, caption) {
    const lines = [chalk.cyan(`\n ${title}`), caption && chalk.reset.italic(` ${caption}`)].filter(Boolean);

    this.log(lines.join('\n'), '\n');
  }

  async _finish() {
    const installSuccessful = await this._installDeps();
    const commitSuccessful = installSuccessful ? this._autoCommit() : true;

    if (commitSuccessful) {
      this._end();
    }
  }

  _installDeps() {
    const projectCfg = this.config.get('project');
    const githubCfg = this.config.get('github');

    if (projectCfg.installDependencies) {
      this._showBrand();
      this._showInstallSteps(3);

      const npmInstall = spawnSync('npm', ['i', '--no-progress', '--no-optional', '--no-audit']);

      if (npmInstall.status !== 0) {
        if (githubCfg.autoCommit) {
          return this.prompt([
            {
              name: 'continue',
              type: 'confirm',
              message: 'npm Installation failed. Skip initial commit?',
              default: 'Press any key',
            },
          ]).then(({ confirm }) => confirm);
        }

        this.log(chalk.bold.red(`  Could not install dependencies. Command '${npmInstall.args.join(' ')}' failed.`));
        process.exit(1);
      }
    }

    return githubCfg.autoCommit;
  }

  _autoCommit() {
    this._showBrand();
    this._showInstallSteps(4);

    const gitAdd = spawnSync('git', ['add', '.']);
    const gitCommit = spawnSync('git', ['commit', '--no-verify', "-m 'First commit'"]);
    const gitPush = spawnSync('git', ['push', '-u', 'origin', 'master']);

    if (gitAdd.status !== 0) {
      const { args, stderr } = gitAdd;

      this._showError(`Could not add files. Command '${args.join(' ')}' failed.\nError: ${stderr.toString()}`);
      return false;
    }

    if (gitCommit.status !== 0) {
      const { args, stderr } = gitCommit;

      this._showError(`Could not commit. Command '${args.join(' ')}' failed.\nError: ${stderr.toString()}`);
      return false;
    }

    if (gitPush.status !== 0) {
      const { args, stderr } = gitPush;

      this._showError(`Could not push. Command '${args.join(' ')}' failed.\nError: ${stderr.toString()}`);
      return false;
    }

    return true;
  }

  _end() {
    this._showBrand();
    this._showInstallSteps(5);
  }
};
