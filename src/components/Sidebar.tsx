import React, { useState } from "react";
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  BarChart3,
  Building2,
  Users,
  TrendingUp,
  CalendarDays,
  RotateCcw,
} from "lucide-react";

type SidebarProps = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {

  const [isExpanded, setIsExpanded] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Visão Geral", icon: LayoutDashboard },
    { id: "lancamentos", label: "Lançamentos", icon: FileText },
    { id: "contas-pagar", label: "Contas a Pagar", icon: CreditCard },
    { id: "contratos", label: "Contratos Fixos", icon: CalendarDays },
    { id: "dre", label: "DRE Construtora", icon: BarChart3 },
    { id: "obras", label: "Obras", icon: Building2 },
    { id: "fornecedores", label: "Fornecedores", icon: Users },
    { id: "receitas", label: "Receitas (12 Meses)", icon: TrendingUp },
  ];

  return (
    <aside
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      className={`${isExpanded ? "w-64" : "w-20"} bg-zinc-950 text-zinc-300 flex flex-col h-screen border-r border-zinc-800 transition-all duration-300 ease-in-out z-20 overflow-hidden relative`}
    >
      <div className={`p-4 border-b border-zinc-800 flex items-center ${isExpanded ? "justify-start" : "justify-center"}`}>
        <div className="flex items-center justify-center min-w-[24px]">
          <Building2 className="text-emerald-500" size={24} />
        </div>
        <div className={`flex items-center gap-2 duration-300 whitespace-nowrap overflow-hidden ${isExpanded ? "opacity-100 ml-2 w-auto" : "opacity-0 w-0 ml-0"}`}>
          <div>
            <h1 className="text-xl font-bold text-white">
              ConstruFin
            </h1>
            <p className="text-[10px] text-zinc-500 mt-1">
              Gestão Financeira
            </p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center ${isExpanded ? "justify-start px-3" : "justify-center px-0"} py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                ? "bg-emerald-500/10 text-emerald-400"
                : "hover:bg-zinc-900 hover:text-white"
                }`}
              title={!isExpanded ? item.label : undefined}
            >
              <div className="flex items-center justify-center min-w-[20px]">
                <Icon
                  size={20}
                  className={isActive ? "text-emerald-500" : "text-zinc-500"}
                />
              </div>
              <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isExpanded ? "opacity-100 ml-3 w-auto" : "opacity-0 w-0 ml-0"}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
      <div className="p-4 border-t border-zinc-800 space-y-2 shrink-0">
        <div className={`text-[10px] text-zinc-600 transition-all duration-300 ${isExpanded ? "opacity-100 text-center" : "opacity-0"}`}>
          <span className="whitespace-nowrap overflow-hidden block">
            &copy; 2024 ConstruFin
          </span>
        </div>
      </div>
    </aside>
  );
}
