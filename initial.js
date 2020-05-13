const path = require('path');
const fs = require('fs-extra')
const { exec } = require("child_process");

const rootDir = __dirname;

async function copyDatabase() {
    const dbExampleFile = path.join(rootDir, 'database.sqlite.example');
    const dbFile = path.join(rootDir, 'database.sqlite');

    try {

        const fileExists = await fs.pathExists(dbFile);

        if (!fileExists) {
            await fs.emptyDir(dbFile);
            await fs.copy(dbExampleFile, dbFile);
            console.log('Database Created!')
        }

    } catch (error) {
        console.error(error)
    }
}

copyDatabase();

console.log('Exec Update database!')
exec('npm run update-database', (error, stdout, stderr) => {
    console.log(`stdout: ${stdout}`);
});

console.log('Exec Build Assets!')
exec('npm run build-assets', (error, stdout, stderr) => {
    console.log(`stdout: ${stdout}`);
});
