const codes = require('iso-lang-codes');
const namor = require('namor');

const nonEmptyString = value => {
  const isValid = value.trim().length > 0;

  return isValid || 'The value cannot be empty';
};

const noSpacesString = value => {
  const isValid = nonEmptyString(value) === true && /\s/g.test(value) === false;

  return isValid || 'The value cannot be empty and should not contain spaces';
};

const reSemver = /v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[\da-z-]+(?:\.[\da-z-]+)*)?(?:\+[\da-z-]+(?:\.[\da-z-]+)*)?/;

const semverRegex = value => {
  const isValid = new RegExp(reSemver, 'gi').test(value);

  return isValid || `'${value}' is not a valid semver format`;
};

const languageCode = value => {
  const isValid = codes.validateLanguageCode(value);
  return isValid || `${value} is not a valid ISO 639-1 language code`;
};

const githubUsername = value => {
  const re = new RegExp(/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,39}$/, 'i');
  const isValid = re.test(value);

  return isValid || `${value} is not a valid Github username`;
};

const reserved = [
  'app',
  'apps',
  'belastingbalie',
  'data',
  'email',
  'fixxx7',
  'fixxx8',
  'fixxx9',
  'fixxx10',
  'fixxx11',
  'fixxx12',
  'fixxx13',
  'fixxx14',
  'fixxx15',
  'fixxx16',
  'fixxx17',
  'fixxx18',
  'fixxx19',
  'fixxx20',
  'flexhoreca',
  'ftp',
  'maps',
  'nha',
  'sia',
  'vga',
  'webmail',
  'www',
];

const subdomain = value => {
  const emptyStringValidation = nonEmptyString(value);
  if (emptyStringValidation !== true) {
    return emptyStringValidation;
  }

  const isValid = namor.isValid(value, { reserved });
  return isValid || `'${value}' is a reserved subdomain`;
};

module.exports = {
  githubUsername,
  languageCode,
  nonEmptyString,
  noSpacesString,
  semverRegex,
  subdomain,
};
