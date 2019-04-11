<img src="https://avatars3.githubusercontent.com/u/14022058?s=200&amp;v=4" height="120" alt="" />

# Datapunt React project generator

[Datapunt/City Data](https://www.amsterdam.nl/bestuur-organisatie/organisatie/dienstverlening/basisinformatie/basisinformatie/overbasisinformatie/distributie/city-data/) flavoured Yeoman `react-boilerplate` generator.

## Introduction

Use this Yeoman generator to set up a new project, based on [`react-boilerplate`](https://github.com/react-boilerplate/react-boilerplate).

The generator takes care of:
- cloning (the latest tag of) [`react-boilerplate`](https://github.com/react-boilerplate/react-boilerplate) repository
- replacing properties and values in `package.json`, setting constants values, preparing `Jenkinsfile` and `Dockerfile`
- adding necessary dependencies
- (optionally) installing all dependencies
- (optionally) pushing the initial commit

## Installation

### Install Yeoman

```
$ npm install -g yo
```

### Clone this repository

After cloning, `cd` into the folder the repository is cloned in and run:

```
npm link
```

This will create a global NPM package and you will be able to run the generator from any folder.

## Running

From the command line, run

```
yo arbp
```

or

```
yo
```

and select `Arbp`.

Follow the steps in the terminal to complete the project installation.
