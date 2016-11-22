// http://eslint.org/docs/user-guide/configuring

module.exports = {

  root: true,

  extends: 'standard',

  'globals': {
    'Key': true,
    'Modal': true,
    'Phoenix': true,
    'Screen': true,
    'Window': true,
  },

  rules: {

    // Require or disallow trailing commas http://eslint.org/docs/rules/comma-dangle
    'comma-dangle': ['error', 'always-multiline'],

    // Limit multiple empty lines http://eslint.org/docs/rules/no-multiple-empty-lines
    'no-multiple-empty-lines': ['error', { 'max': 2 }],

    // Disable padding within blocks http://eslint.org/docs/rules/padded-blocks.html
    'padded-blocks': 'off',

  }

}
