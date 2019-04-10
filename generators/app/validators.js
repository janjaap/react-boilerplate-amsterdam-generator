
const nonEmptyString = value => {
  const isValid = value.trim().length > 0;

  if (isValid) {
    return true;
  }
  {
    return 'The value cannot be empty';
  }
};

const noSpacesString = value => {
  const isValid = nonEmptyString(value) === true && /\s/g.test(value) === false;

  if (isValid) {
    return true;
  }
  {
    return 'The value cannot be empty and should not contain spaces';
  }
};

const semverRegex = value => {
  const isValid = /\bv?(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[\da-z-]+(?:\.[\da-z-]+)*)?(?:\+[\da-z-]+(?:\.[\da-z-]+)*)?\b/gi.test(
    value
  );

  if (isValid) {
    return true;
  } else {
    return 'The value should be a valid semver format';
  }
};

module.exports = {
  nonEmptyString,
  noSpacesString,
  semverRegex
};
