import * as vscode from "vscode";

interface CSSSelectors {
  [key: string]: string;
}

export function activate(context: vscode.ExtensionContext) {
  let saveSelector = vscode.commands.registerCommand(
    "css-storage.save-css-selector",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("No file is open in the editor.");
        return;
      }

      const selectedText = editor.document.getText(editor.selection);
      if (!selectedText.trim()) {
        vscode.window.showErrorMessage("No text selected to save.");
        return;
      }

      const selectorNameMatch = selectedText.match(/([^\s\{\}]+)\s*\{/);
      if (!selectorNameMatch) {
        vscode.window.showErrorMessage(
          "Unable to extract CSS selector name from selected text."
        );
        return;
      }

      const storedSelectors = context.globalState.get<CSSSelectors>(
        "css-selectors",
        {}
      );
      const selectorName = selectorNameMatch[1];
      storedSelectors[selectorName] = selectedText;

      await context.globalState.update("css-selectors", storedSelectors);

      vscode.window.showInformationMessage(
        `CSS selector "${selectorName}" saved successfully.`
      );
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
        vscode.window.showInformationMessage("No CSS selectors saved yet.");
        return;
      }

      const selectedKey = await vscode.window.showQuickPick(selectorKeys, {
        placeHolder: "Select a CSS selector to retrieve",
      });

      if (!selectedKey) {
        return;
      }

      const selectedText = storedSelectors[selectedKey];
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        editor.edit((editBuilder) => {
          editBuilder.replace(editor.selection, selectedText);
        });
        vscode.window.showInformationMessage(
          `CSS selector "${selectedKey}" retrieved and applied successfully.`
        );
      } else {
        vscode.window.showErrorMessage(
          "No file is open in the editor to apply the CSS selector."
        );
      }
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
        vscode.window.showInformationMessage("No CSS selectors saved yet.");
        return;
      }

      const selectedKey = await vscode.window.showQuickPick(selectorKeys, {
        placeHolder: "Select a CSS selector to delete",
      });

      if (!selectedKey) {
        return;
      }

      delete storedSelectors[selectedKey];

      await context.globalState.update("css-selectors", storedSelectors);

      vscode.window.showInformationMessage(
        `CSS selector "${selectedKey}" deleted successfully.`
      );
    }
  );

  context.subscriptions.push(saveSelector, retrieveSelector, deleteSelector);
}

export function deactivate() {}
