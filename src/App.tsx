/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Lancamentos from "./components/Lancamentos";
import ContasPagar from "./components/ContasPagar";
import DRE from "./components/DRE";
import RelatorioObra from "./components/RelatorioObra";
import Fornecedores from "./components/Fornecedores";
import Receitas from "./components/Receitas";
import Contratos from "./components/Contratos";
import { initializeXataSync } from "./mockData";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [efetivarData, setEfetivarData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeXataSync().finally(() => {
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-50 font-sans text-zinc-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-sm font-medium text-zinc-500 animate-pulse">
            Sincronizando com o banco Xata...
          </p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "lancamentos":
        return <Lancamentos setActiveTab={setActiveTab} efetivarData={efetivarData} setEfetivarData={setEfetivarData} />;
      case "contas-pagar":
        return <ContasPagar onEfetivar={(data: any) => { setEfetivarData(data); setActiveTab("lancamentos"); }} />;
      case "dre":
        return <DRE />;
      case "relatorio-obra":
        return <RelatorioObra />;
      case "fornecedores":
        return <Fornecedores />;
      case "receitas":
        return <Receitas />;
      case "contratos":
        return <Contratos />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-zinc-50 font-sans text-zinc-900 overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-y-auto">{renderContent()}</main>
    </div>
  );
}
