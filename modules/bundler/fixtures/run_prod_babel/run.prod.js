// @ts-check
/* eslint-disable */

const { Run } = require('../../../../npm_target/run');

Run.production({
  parseWithBabel: true,
  root: process.cwd(),
  customEnv: 'test',
  customConfig: `${process.cwd()}/test.json`,
})
  .then(() => {
    console.log('bundled worked');
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
