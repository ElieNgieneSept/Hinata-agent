const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const sourceDir = path.join(projectRoot, 'Hinata');
const outputDir = path.join(projectRoot, 'Installateurs', 'Navigateur');
const stagingDir = path.join(outputDir, 'Hinata-Web');
const version = require(path.join(projectRoot, 'package.json')).version;
const archivePath = path.join(outputDir, `Hinata-Web-${version}.zip`);

fs.rmSync(stagingDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });
fs.cpSync(sourceDir, stagingDir, {
	recursive: true,
	filter(source) {
		const relative = path.relative(sourceDir, source);
		if (!relative) return true;
		const segments = relative.split(path.sep);
		return !segments.includes('data')
			&& !segments.includes('historique')
			&& path.basename(source) !== '.DS_Store';
	}
});

const readme = `Hinata - Version navigateur locale

Ouvrez index.html dans un navigateur compatible, de préférence Chrome ou Edge.
Les données et réglages restent stockés localement dans le profil du navigateur.
`;
fs.writeFileSync(path.join(stagingDir, 'README-WEB.txt'), readme, 'utf8');

fs.rmSync(archivePath, { force: true });
execFileSync('zip', ['-qr', archivePath, '.'], { cwd: stagingDir, stdio: 'inherit' });
fs.rmSync(stagingDir, { recursive: true, force: true });
console.log(`Archive navigateur créée : ${archivePath}`);