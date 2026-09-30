#!/usr/bin/env node
/** Keep demo UI expressed with Plocks components and named props. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const forbiddenTags = new Set([
  'View', 'Pressable', 'ScrollView', 'TextInput', 'ImageBackground',
  'SafeAreaView', 'KeyboardAvoidingView', 'ActivityIndicator', 'Animated.View',
]);
const forbiddenProps = new Set(['style', 'contentContainerStyle', 'containerStyle', 'imageStyle']);
const errors = [];

function visitFiles(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') visitFiles(path.join(directory, entry.name));
    } else if (entry.name.endsWith('.tsx')) {
      validateFile(path.join(directory, entry.name));
    }
  }
}

function validateFile(file) {
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const nativeImage = source.statements.some(statement =>
    ts.isImportDeclaration(statement) && statement.moduleSpecifier.text === 'react-native' &&
    statement.importClause?.namedBindings && ts.isNamedImports(statement.importClause.namedBindings) &&
    statement.importClause.namedBindings.elements.some(element => element.name.text === 'Image')
  );
  const report = (node, detail) => {
    const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
    errors.push(`${path.relative(root, file)}:${line}: ${detail}`);
  };
  function walk(node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(source);
      if (forbiddenTags.has(tag) || (tag === 'Image' && nativeImage)) report(node, `use a Plocks component instead of <${tag}>`);
      for (const attribute of node.attributes.properties) {
        if (ts.isJsxAttribute(attribute) && forbiddenProps.has(attribute.name.text)) {
          report(attribute, `use named Plocks props instead of ${attribute.name.text}`);
        }
      }
    }
    ts.forEachChild(node, walk);
  }
  walk(source);
}

for (const directory of ['apps', 'snacks']) visitFiles(path.join(root, directory));
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log('All app and Snack UI uses Plocks components and named props.');
}
