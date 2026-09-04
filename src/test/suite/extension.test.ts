import * as assert from 'assert';

// 'vscode'モジュールからすべてのAPIをインポートして使用することができます
// あなたの拡張機能をインポートしてテストすることもできます
import * as vscode from 'vscode';
import { Parser } from '../../parser';
import { ChartNode, NoteNode } from '../../types/node';
import { t } from '../../i18n';
// import * as myExtension from '../../extension';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});

	test('A second 9 marks the 5000-point border without starting another balloon', async () => {
		const document = await vscode.workspace.openTextDocument({
			language: 'tja',
			content: 'BALLOON:10,20\nCOURSE:Oni\n#START\n90900008,\n90000008,\n#END'
		});
		const result = new Parser(document).parse();
		const chart = result.root.find<ChartNode>((node) => node instanceof ChartNode);
		assert.ok(chart);

		assert.deepStrictEqual(result.diagnostics.realtime, []);
		assert.deepStrictEqual(result.diagnostics.unedited, []);

		const nines = chart.filter<NoteNode>(
			(node) => node instanceof NoteNode && node.value === '9'
		);
		assert.deepStrictEqual(
			nines.map((node) => node.properties.note.balloonId),
			[0, 0, 1]
		);
		assert.strictEqual(String(nines[1].properties.rollState), 'BalloonBigBorder');
		assert.strictEqual(
			chart.properties.info.notes.filter(
				(note) => note.type === 'Balloon' && note.size === 'Big'
			).length,
			2
		);
	});

	test('A third 9 before the roll end reports an interrupted roll', async () => {
		const document = await vscode.workspace.openTextDocument({
			language: 'tja',
			content: 'BALLOON:10\nCOURSE:Oni\n#START\n909900008,\n#END'
		});
		const result = new Parser(document).parse();
		const interruptions = result.diagnostics.realtime.filter(
			(diagnostic) =>
				diagnostic.message ===
				`${t('semanticTokens.balloon')}${t('parser.rollNoteInterrupted')}`
		);

		assert.strictEqual(interruptions.length, 1);
		assert.ok(interruptions[0].range.start.isEqual(new vscode.Position(3, 3)));
		assert.strictEqual(interruptions[0].severity, vscode.DiagnosticSeverity.Warning);
		assert.strictEqual(interruptions[0].code, undefined);
	});
});
