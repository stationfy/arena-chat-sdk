/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');

const packages = ['chat-sdk', 'core', 'liveblog-sdk', 'types']
const dependencies = ['chat-sdk', 'core', 'liveblog-sdk', 'chat-types']

packages.forEach(packageName => {
    const packagePath = path.join(__dirname, 'packages', packageName, 'package.json');
    const packageJSON = require(packagePath);
    const versionParts = packageJSON.version.split('.');
    const newVersion = `${versionParts[0]}.${versionParts[1]}.${versionParts[2]}-prd-eu`;
    packageJSON.version = newVersion;



    dependencies.forEach(dependencyName => {
        if (packageJSON.dependencies?.[`@arena-im/${dependencyName}`]) {
            packageJSON.dependencies[`@arena-im/${dependencyName}`] = newVersion;
        }
    })

    fs.writeFileSync(packagePath, JSON.stringify(packageJSON, null, 2), 'utf-8');
})