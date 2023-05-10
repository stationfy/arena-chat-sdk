/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');
const fetch = require('npm-registry-fetch');

/**
 * 
 * @param {'beta' | 'prd-eu' | 'stg'} tag 
 * @param {string=} newVersion
 */
function changePackageVersion (tag = 'prd-eu', newVersion) {
    const packages = ['chat-sdk', 'core', 'liveblog-sdk', 'types']
    const dependencies = ['chat-sdk', 'core', 'liveblog-sdk', 'chat-types']
    
    packages.forEach(packageName => {
        const packagePath = path.join(__dirname, 'packages', packageName, 'package.json');
        const packageJSON = require(packagePath);
        const versionParts = packageJSON.version.split('.');
        
        if (tag === 'prd-eu') {
            newVersion = `${versionParts[0]}.${versionParts[1]}.${versionParts[2]}-prd-eu`;
        }

        packageJSON.version = newVersion;

        dependencies.forEach(dependencyName => {
            if (packageJSON.dependencies?.[`@arena-im/${dependencyName}`]) {
                packageJSON.dependencies[`@arena-im/${dependencyName}`] = newVersion;
            }
        })
    
        fs.writeFileSync(packagePath, JSON.stringify(packageJSON, null, 2), 'utf-8');
    })
}

/**
 * 
 * @param {string} packageName 
 * @param {string} tag 
 * @returns {Promise<{versions: {[versionName: string]: Object}, "dist-tags": {latest: string; beta: string; "prd-eu": string; stg: string}}>}
 */
async function getLastVersion(packageName) {
  try {
    const url = `https://registry.npmjs.org/${packageName}`;
    const packageData = await fetch.json(url);

    if (packageData) {
      return packageData;
    } else {
      throw new Error(`Package ${packageName} not found`);
    }
  } catch (error) {
    console.error(`Failed to fetch the last version of ${packageName}:`, error.message);
  }
}

/**
 * 
 * @param {'beta' | 'prd-eu' | 'stg'} tag 
 */
async function bumpVersion (tag) {
    const packageName = '@arena-im/core';

    const {"dist-tags": distTags, versions} = await getLastVersion(packageName)
    
    const {latest: latestVersion} = distTags

    const [latestMajor, latestMinor, latestPatch] = latestVersion.split('.')

    const nextVersion = findNextVersion(latestMajor, latestMinor, latestPatch, versions, tag)

    return nextVersion
}

/**
 * 
 * @param {string} latestMajor 
 * @param {string} latestMinor 
 * @param {string} latestPatch 
 * @param {{[versionName: string]: Object}} versions 
 * @param {string} tag
 */
function findNextVersion (latestMajor, latestMinor, latestPatch, versions, tag) {
    const patch = parseInt(latestPatch)
    const nextPatch = `${patch + 1}`
    let currentTagVersion = 0
    let nextVersion = `${latestMajor}.${latestMinor}.${nextPatch}-${tag}.${currentTagVersion}`
    console.log(versions[nextVersion])
    while (versions[nextVersion]) {
        nextVersion = `${latestMajor}.${latestMinor}.${nextPatch}-${tag}.${++currentTagVersion}`
    }

    return nextVersion
}

(async () => {
    /** @type {'beta' | 'prd-eu' | 'stg'} */
    const tag = process.argv[2]

    if (tag === 'prd-eu') {
        changePackageVersion('prd-eu')
    } else {
        const newVersion = await bumpVersion(tag)

        changePackageVersion(tag, newVersion)
    }
})()
