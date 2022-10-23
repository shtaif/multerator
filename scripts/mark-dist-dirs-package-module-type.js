const { writeFileSync } = require('fs');

const distDirNameAndPackageFileMappings = {
  'dist/esm': { type: 'module' },
  'dist/cjs': { type: 'commonjs' },
};

Object.entries(distDirNameAndPackageFileMappings).forEach(
  ([distDirName, packageFileContents]) => {
    const destPath = `${__dirname}/../${distDirName}/package.json`;
    const output = JSON.stringify(packageFileContents, undefined, 2);
    writeFileSync(destPath, output);
  }
);
