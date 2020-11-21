// @ts-check
/* eslint-disable */

const { Run } = require('../../../../npm_target/run');

Run.development({
  hmr: true,
  root: process.cwd(),
  customEnv: 'test',
  loadConfigPathToFile: `${process.cwd()}/test.json`,
});