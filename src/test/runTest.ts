import * as path from 'path';

import { runTests } from '@vscode/test-electron';

async function main() {
	try {
		// Extension Manifestのpackage.jsonが格納されているフォルダ
		// `--extensionDevelopmentPath` に渡される
		const extensionDevelopmentPath = path.resolve(__dirname, '../../');

		// test runner へのパス
		// --extensionTestsPath に渡される
		const extensionTestsPath = path.resolve(__dirname, './suite/index');

		// VSCodeをダウンロードし、解凍して統合テストを実行します
		await runTests({ extensionDevelopmentPath, extensionTestsPath });
	} catch (err) {
		console.error('Failed to run tests');
		process.exit(1);
	}
}

main();
