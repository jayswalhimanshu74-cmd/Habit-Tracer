require('dotenv').config({ path: '../env.' });

module.exports = {
  testEnvironment: 'node',
  globalSetup: './tests/setup.js',
};