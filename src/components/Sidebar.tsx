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
  BookUser,
  ChevronRight
} from "lucide-react";

type SidebarProps = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {

  const [isExpanded, setIsExpanded] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const menuItems = [
    { id: "dashboard", label: "Visão Geral", icon: LayoutDashboard },
    { id: "lancamentos", label: "Lançamentos", icon: FileText },
    { id: "contas-pagar", label: "Contas a Pagar", icon: CreditCard },
    { id: "contratos", label: "Contratos Fixos", icon: CalendarDays },
    { id: "dre", label: "DRE Construtora", icon: BarChart3 },
    { 
      id: "contatos", 
      label: "Contatos", 
      icon: BookUser,
      subItems: [
        { id: "obras", label: "Obras" },
        { id: "fornecedores", label: "Fornecedor / Recebedor" },
      ]
    },
    { id: "receitas", label: "Receitas (12 Meses)", icon: TrendingUp },
  ];

  return (
    <aside
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => {
        setIsExpanded(false);
        setActiveDropdown(null);
      }}
      className={`${isExpanded ? "w-64" : "w-20"} bg-zinc-950 text-zinc-300 flex flex-col h-screen border-r border-zinc-800 transition-all duration-300 ease-in-out z-50 relative`}
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
      <nav className={`flex-1 p-4 space-y-1 ${activeDropdown ? 'overflow-visible' : 'overflow-y-auto'}`}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id || (item.subItems && item.subItems.some(sub => sub.id === activeTab));
          const isDropdownOpen = activeDropdown === item.id;

          return (
            <div key={item.id} className="relative">
              <button
                onClick={() => {
                  if (item.subItems) {
                    setActiveDropdown(isDropdownOpen ? null : item.id);
                  } else {
                    setActiveTab(item.id);
                    setActiveDropdown(null);
                  }
                }}
                className={`w-full flex items-center justify-between py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "hover:bg-zinc-900 hover:text-white"
                  } ${isExpanded ? "px-3" : "px-0 justify-center"}`}
                title={!isExpanded ? item.label : undefined}
              >
                <div className="flex items-center">
                  <div className="flex items-center justify-center min-w-[20px]">
                    <Icon
                      size={20}
                      className={isActive ? "text-emerald-500" : "text-zinc-500"}
                    />
                  </div>
                  <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isExpanded ? "opacity-100 ml-3 w-auto" : "opacity-0 w-0 ml-0"}`}>
                    {item.label}
                  </span>
                </div>
                {item.subItems && (
                  <ChevronRight size={16} className={`transition-all duration-300 ${isExpanded ? "opacity-100" : "opacity-0 w-0"} ${isDropdownOpen ? 'rotate-90' : ''}`} />
                )}
              </button>

              {item.subItems && isDropdownOpen && (
                <div className="absolute left-full top-0 ml-2 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl w-48 py-2 z-[100]">
                  {item.subItems.map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => {
                        setActiveTab(sub.id);
                        setActiveDropdown(null);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-zinc-800 transition-colors ${activeTab === sub.id ? 'text-emerald-400 font-medium' : 'text-zinc-300'}`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
