import { Project, SyntaxKind, VariableDeclarationKind } from "ts-morph";
import * as path from "path";

const project = new Project();
const componentsDir = path.join(process.cwd(), "src", "components");
project.addSourceFilesAtPaths(`${componentsDir}/**/*.tsx`);

const sourceFiles = project.getSourceFiles();

for (const sourceFile of sourceFiles) {
  // 1. Replace import
  const mockImport = sourceFile.getImportDeclaration(decl => decl.getModuleSpecifierValue() === "../mockData");
  if (mockImport) {
    mockImport.remove();
    sourceFile.addImportDeclaration({
      namedImports: ["useData"],
      moduleSpecifier: "../contexts/DataContext"
    });
  }

  // 2. Inject useData into main component function
  const baseName = sourceFile.getBaseNameWithoutExtension();
  const func = sourceFile.getFunction(baseName);
  
  if (func) {
    const body = func.getBody();
    if (body && body.getKind() === SyntaxKind.Block) {
      const useDataStmt = `const { obras, fornecedores, lancamentos, contratos, addLancamento, updateLancamento, deleteLancamento, addObra, updateObra, deleteObra, addFornecedor, updateFornecedor, deleteFornecedor, addContrato, updateContrato, deleteContrato } = useData();`;
      const aliases = `
  const initialLancamentos = lancamentos;
  const initialContratos = contratos;
  const initialObras = obras;
  const initialFornecedores = fornecedores;
`;
      // Check if already injected
      if (!sourceFile.getText().includes("useData();")) {
        func.insertStatements(0, useDataStmt + aliases);
      }
    }
  }

  // 3. Fix mutations depending on file
  if (baseName === "Contratos") {
      sourceFile.getVariableDeclaration("data")?.getInitializer()?.replaceWithText("initialContratos");
      sourceFile.getFunction("handleSave")?.setIsAsync(true);
      const entryDecl = sourceFile.getVariableDeclaration("entry");
      if (entryDecl) {
          entryDecl.setType("Omit<Contrato, 'id'>");
          const init = entryDecl.getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);
          if (init) {
             const idProp = init.getProperty("id");
             if (idProp) idProp.remove();
          }
      }
      
      const hsFunc = sourceFile.getFunction("handleSave");
      if (hsFunc) {
        // Find setData and remove it, replace with await addContrato
        const stmts = hsFunc.getStatements();
        for (const stmt of stmts) {
            if (stmt.getText().includes("setData([")) {
                stmt.replaceWithText(`try { await addContrato(entry as any); setIsAdding(false); } catch(e) { alert("Erro"); }`);
            } else if (stmt.getText().includes("initialContratos.unshift")) {
                stmt.remove();
            } else if (stmt.getText().includes("setIsAdding(false)") && !stmt.getText().includes("try")) {
                stmt.remove();
            }
        }
      }
  }

  if (baseName === "Fornecedores") {
      sourceFile.getVariableDeclaration("data")?.getInitializer()?.replaceWithText("fornecedores");
      sourceFile.getFunction("handleSave")?.setIsAsync(true);
      const entryDecl = sourceFile.getVariableDeclaration("entry");
      if (entryDecl) {
          entryDecl.setType("Omit<Fornecedor, 'id'>");
          const init = entryDecl.getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);
          if (init) {
             const idProp = init.getProperty("id");
             if (idProp) idProp.remove();
          }
      }
      
      const hsFunc = sourceFile.getFunction("handleSave");
      if (hsFunc) {
        const stmts = hsFunc.getStatements();
        for (const stmt of stmts) {
            if (stmt.getText().includes("setData([")) {
                stmt.replaceWithText(`try { await addFornecedor(entry as any); setIsAdding(false); } catch(e) { alert("Erro"); }`);
            } else if (stmt.getText().includes("fornecedores.push")) {
                stmt.remove();
            } else if (stmt.getText().includes("setIsAdding(false)") && !stmt.getText().includes("try")) {
                stmt.remove();
            }
        }
      }
  }

  if (baseName === "ContasPagar") {
      sourceFile.getFunction("handleSaveNewConta")?.setIsAsync(true);
      sourceFile.getFunction("handleConfirmPagamento")?.setIsAsync(true);
      sourceFile.getFunction("handleSaveEdit")?.setIsAsync(true);

      const hsnc = sourceFile.getFunction("handleSaveNewConta");
      if (hsnc) {
          const entryDecl = hsnc.getVariableDeclaration("entry");
          if (entryDecl) {
              entryDecl.setType("any");
              const init = entryDecl.getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);
              if (init) {
                 const idProp = init.getProperty("id");
                 if (idProp) idProp.remove();
              }
          }
          const stmts = hsnc.getStatements();
          for (const stmt of stmts) {
              if (stmt.getText().includes("initialLancamentos.unshift")) {
                  stmt.replaceWithText(`try { await addLancamento(entry); setIsAdding(false); } catch(e) { alert("Erro"); }`);
              } else if (stmt.getText().includes("setLancamentosBase")) {
                  stmt.remove();
              } else if (stmt.getText().includes("setIsAdding(false)") && !stmt.getText().includes("try")) {
                  stmt.remove();
              }
          }
      }

      const hcp = sourceFile.getFunction("handleConfirmPagamento");
      if (hcp) {
          const stmts = hcp.getStatements();
          for (const stmt of stmts) {
              if (stmt.getText().includes("initialLancamentos.splice")) {
                  stmt.replaceWithText(`await updateLancamento(updated);`);
              } else if (stmt.getText().includes("setLancamentosBase")) {
                  stmt.remove();
              }
          }
      }

      const hse = sourceFile.getFunction("handleSaveEdit");
      if (hse) {
          const stmts = hse.getStatements();
          for (const stmt of stmts) {
              if (stmt.getText().includes("initialLancamentos.splice")) {
                  stmt.replaceWithText(`await updateLancamento(updated);`);
              } else if (stmt.getText().includes("setLancamentosBase")) {
                  stmt.remove();
              }
          }
      }
  }
}

project.saveSync();
console.log("TS-Morph refactor complete.");
