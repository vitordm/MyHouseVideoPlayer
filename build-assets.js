const { exec } = require("child_process");
const path = require('path');
const fs = require('fs-extra')

const rootDir = __dirname;
const publicAssets = path.join(__dirname, 'public', 'assets');

async function copyBootstrap() {
    const bootstrapDistFolder = path.join(rootDir, 'node_modules', 'bootstrap', 'dist');
    const bootstrapPublicFolder = path.join(publicAssets, 'bootstrap');

    try {
        await fs.emptyDir(bootstrapPublicFolder);
        await fs.copy(bootstrapDistFolder, bootstrapPublicFolder);
        console.log('Bootstrap Copied!')
    } catch (error) {
        console.error(error)
    }
}

async function copyJquery() {
    const jqueryDistFolder = path.join(rootDir, 'node_modules', 'jquery', 'dist');
    const jqueryPublicFolder = path.join(publicAssets, 'jquery');

    const jquerySerializeToJqueryDistFolder = path.join(rootDir, 'node_modules', 'jquery-serializetojson', 'dist');
    const jquerySerializeToJqueryPublicFolder = path.join(publicAssets, 'jquery-serializetojson');

    try {
        await fs.emptyDir(jqueryPublicFolder);
        await fs.copy(jqueryDistFolder, jqueryPublicFolder);

        await fs.emptyDir(jquerySerializeToJqueryPublicFolder);
        await fs.copy(jquerySerializeToJqueryDistFolder, jquerySerializeToJqueryPublicFolder);
        console.log('Jquery Copied!')
    } catch (error) {
        console.error(error)
    }
}

async function copyFontAwesome() {
    const fontawesomeDistFolder = path.join(rootDir, 'node_modules', '@fortawesome', 'fontawesome-free');
    const fontawesomePublicFolder = path.join(publicAssets, 'fontawesome');

    try {
        await fs.emptyDir(fontawesomePublicFolder);
        await fs.copy(fontawesomeDistFolder, fontawesomePublicFolder);
        console.log('Fontawesome Copied!')
    } catch (error) {
        console.error(error)
    }
}

async function copyBootbox() {
    const bootboxDistFolder = path.join(rootDir, 'node_modules', 'bootbox', 'dist');
    const bootboxPublicFolder = path.join(publicAssets, 'bootbox');

    try {
        await fs.emptyDir(bootboxPublicFolder);
        await fs.copy(bootboxDistFolder, bootboxPublicFolder);
        console.log('Bootbox Copied!')
    } catch (error) {
        console.error(error)
    }
}

async function copyLibs() {
    const libsDistFolder = path.join(rootDir, 'libs');
    const libsPublicFolder = path.join(publicAssets, 'libs');

    try {
        await fs.emptyDir(libsPublicFolder);
        await fs.copy(libsDistFolder, libsPublicFolder);
        console.log('Libs Copied!')
    } catch (error) {
        console.error(error)
    }
}

copyBootstrap();
copyJquery();
copyFontAwesome();
copyBootbox();
copyLibs();