import * as vscode from "vscode";

interface CSSSelectors {
  [key: string]: string;
}

export function activate(context: vscode.ExtensionContext) {
  const showError = (message: string) => vscode.window.showErrorMessage(message);
  const showInfo = (message: string) => vscode.window.showInformationMessage(message);

  const getActiveEditor = () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      showError("No file is open in the editor.");
    }
    return editor;
  };

  const extractSelectorName = (text: string) => {
    const match = text.match(/([^\s\{\}]+)\s*\{/);
    return match ? match[1] : null;
  };

  let saveSelector = vscode.commands.registerCommand(
    "css-storage.save-css-selector",
    async () => {
      const editor = getActiveEditor();
      if (!editor) return;

      const selectedText = editor.document.getText(editor.selection).trim();
      if (!selectedText) {
        showError("No text selected to save.");
        return;
      }

      const selectorName = extractSelectorName(selectedText);
      if (!selectorName) {
        showError("Unable to extract CSS selector name from selected text.");
        return;
      }

      const storedSelectors = context.globalState.get<CSSSelectors>(
        "css-selectors",
        {}
      );
      storedSelectors[selectorName] = selectedText;

      await context.globalState.update("css-selectors", storedSelectors);
      showInfo(`CSS selector "${selectorName}" saved successfully.`);
    }
  );

  let retrieveSelector = vscode.commands.registerCommand(
    "css-storage.retrieve-css-selector",
    async () => {
      const storedSelectors = context.globalState.get<CSSSelectors>(
        "css-selectors",
        {}
      );
      const selectorKeys = Object.keys(storedSelectors);

      if (selectorKeys.length === 0) {
        showInfo("No CSS selectors saved yet.");
        return;
      }

      const selectedKey = await vscode.window.showQuickPick(selectorKeys, {
        placeHolder: "Select a CSS selector to retrieve",
      });

      if (!selectedKey) return;

      const selectedText = storedSelectors[selectedKey];
      const editor = getActiveEditor();
      if (!editor) return;

      editor.edit((editBuilder) => {
        editBuilder.replace(editor.selection, selectedText);
      });
      showInfo(
        `CSS selector "${selectedKey}" retrieved and applied successfully.`
      );
    }
  );

  let deleteSelector = vscode.commands.registerCommand(
    "css-storage.delete-css-selector",
    async () => {
      const storedSelectors = context.globalState.get<CSSSelectors>(
        "css-selectors",
        {}
      );
      const selectorKeys = Object.keys(storedSelectors);

      if (selectorKeys.length === 0) {
        showInfo("No CSS selectors saved yet.");
        return;
      }

      const selectedKey = await vscode.window.showQuickPick(selectorKeys, {
        placeHolder: "Select a CSS selector to delete",
      });

      if (!selectedKey) return;

      delete storedSelectors[selectedKey];
      await context.globalState.update("css-selectors", storedSelectors);

      showInfo(`CSS selector "${selectedKey}" deleted successfully.`);
    }
  );

  context.subscriptions.push(saveSelector, retrieveSelector, deleteSelector);
}

export function deactivate() {}
