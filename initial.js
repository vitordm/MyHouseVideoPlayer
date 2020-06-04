const path = require('path');
const fs = require('fs-extra')
const { exec } = require("child_process");

const rootDir = __dirname;

async function copyDatabase() {
    const dbExampleFile = path.join(rootDir, 'database.sqlite.example');
    const dbFile = path.join(rootDir, 'database.sqlite');

    try {

        console.log(dbFile);
        const fileExists = await fs.pathExists(dbFile);
        if (!fileExists) {
            await fs.copy(dbExampleFile, dbFile);
            console.log('Database Created!')
        }

    } catch (error) {
        console.error(error)
        throw error;
    }
}


copyDatabase()
    .then(() => {
        console.log('Exec Update database!')
        exec('npm run update-database', (error, stdout, stderr) => {
            console.log(`stdout: ${stdout}`);
        });

        console.log('Exec Build Assets!')
        exec('npm run build-assets', (error, stdout, stderr) => {
            console.log(`stdout: ${stdout}`);
        });
    })
    .catch(err => {

    });