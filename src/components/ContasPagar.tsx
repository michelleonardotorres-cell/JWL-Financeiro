import React, { useState, useMemo } from "react";
import { safeFormatDate } from "../utils";
import { CheckCircle2, Clock, AlertCircle, Plus, Check, X, Eye } from "lucide-react";
import { useData } from "../contexts/DataContext";

export default function ContasPagar({ onEfetivar }: { onEfetivar?: (data: any) => void }) {
    const { obras, fornecedores, lancamentos, contratos, addLancamento, updateLancamento, deleteLancamento, addObra, updateObra, deleteObra, addFornecedor, updateFornecedor, deleteFornecedor, addContrato, updateContrato, deleteContrato } = useData();
      const initialLancamentos = lancamentos;
      const initialContratos = contratos;
      const initialObras = obras;
      const initialFornecedores = fornecedores;

  const [filterStatus, setFilterStatus] = useState<
    "Todos" | "Aberto" | "Atrasado" | "Pago"
  >("Todos");
  const [isAdding, setIsAdding] = useState(false);
  const [valorInput, setValorInput] = useState("");
  const [newConta, setNewConta] = useState({
    dataVencimento: new Date().toISOString().split('T')[0],
    descricao: "",
    fornecedorNome: "",
    obraNome: "",
    valor: 0,
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    const numericValue = Number(value) / 100;
    setValorInput(formatCurrency(numericValue));
    setNewConta((prev) => ({ ...prev, valor: numericValue }));
  };

  const handleSaveNewConta = () => {
    if (!newConta.descricao || !newConta.valor) {
      alert("Por favor, preencha a descrição e o valor.");
      return;
    }

    let supplier = fornecedores.find(
      (f) => f.nome.toLowerCase() === newConta.fornecedorNome.toLowerCase()
    );
    let fornecedorId = supplier?.id;
    if (newConta.fornecedorNome && !supplier) {
      const newF = {
        id: `f${fornecedores.length + 1}`,
        nome: newConta.fornecedorNome,
        cnpj: "00.000.000/0001-00",
      };
      fornecedores.push(newF);
      fornecedorId = newF.id;
    }

    let obra = obras.find(
      (o) => o.nome.toLowerCase() === newConta.obraNome.toLowerCase()
    );
    let obraId = obra?.id || newConta.obraNome;

    const entry = {
      id: `l${initialLancamentos.length + 1}`,
      dataCompetencia: newConta.dataVencimento,
      dataVencimento: newConta.dataVencimento,
      formaPagamento: "BOLETO",
      descricao: newConta.descricao,
      valor: newConta.valor,
      tipo: "Despesa" as const,
      categoria: "Materiais",
      fornecedorId: fornecedorId,
      obraId: obraId,
      status: "Aberto" as const,
    };

    initialLancamentos.unshift(entry);
    setLancamentosBase([...initialLancamentos]);
    setIsAdding(false);
    setNewConta({
      dataVencimento: new Date().toISOString().split('T')[0],
      descricao: "",
      fornecedorNome: "",
      obraNome: "",
      valor: 0,
    });
    setValorInput("");
    alert("Nova conta cadastrada com sucesso!");
  };

  const handleCancelNewConta = () => {
    setIsAdding(false);
    setNewConta({
      dataVencimento: new Date().toISOString().split('T')[0],
      descricao: "",
      fornecedorNome: "",
      obraNome: "",
      valor: 0,
    });
    setValorInput("");
  };

  const handlePagar = (id: string) => {
    const index = initialLancamentos.findIndex((l) => l.id === id);
    if (index !== -1) {
      const updated = {
        ...initialLancamentos[index],
        status: "Pago" as const,
        dataPagamento: new Date().toISOString().split("T")[0],
      };
      initialLancamentos.splice(index, 1, updated);
      setLancamentosBase([...initialLancamentos]);
      alert("Conta marcada como paga!");
    }
  };

  const handleDesfazerPagamento = (id: string) => {
    const index = initialLancamentos.findIndex((l) => l.id === id);
    if (index !== -1) {
      const updated = {
        ...initialLancamentos[index],
        status: "Aberto" as const,
        dataPagamento: undefined,
      };
      initialLancamentos.splice(index, 1, updated);
      setLancamentosBase([...initialLancamentos]);
      alert("Pagamento desfeito com sucesso! A conta voltou para o estado em aberto.");
    }
  };

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const [lancamentosBase, setLancamentosBase] = useState(initialLancamentos);

  const previsoes = useMemo(() => {
    return contratos
      .filter((c) => c.ativo)
      .filter((c) => {
        // Only show if a lancamento hasn't been generated for this month
        const thisMonthLancamento = lancamentosBase.find((l) => {
          if (!l.contratoId || l.contratoId !== c.id) return false;
          const compDate = l.dataCompetencia ? new Date(l.dataCompetencia) : new Date(l.dataVencimento);
          return compDate.getMonth() === currentMonth && compDate.getFullYear() === currentYear;
        });
        return !thisMonthLancamento;
      })
      .map((c) => {
        const dataVencimento = new Date(currentYear, currentMonth, c.diaVencimento).toISOString().split('T')[0];
        return {
          id: `prev-${c.id}`,
          isPrevisao: true,
          contratoId: c.id,
          dataCompetencia: dataVencimento, // Defaults to vencimento until effective
          dataVencimento,
          descricao: c.descricao,
          recebedorFornecedor: c.recebedorFornecedor,
          fornecedorId: c.fornecedorId,
          valor: c.valorPrevisto,
          status: "Aberto" as const,
          tipo: "Despesa" as const,
          categoria: c.categoria,
          obraId: c.obraId,
        };
      });
  }, [contratos, lancamentosBase, currentMonth, currentYear]);

  const despesas = [
    ...lancamentosBase.filter((l) => l.tipo === "Despesa"),
    ...previsoes
  ];

  const filtered = despesas
    .filter((l) => {
      if (filterStatus === "Todos") return true;
      return l.status === filterStatus;
    })
    .sort(
      (a, b) =>
        new Date(a.dataVencimento).getTime() -
        new Date(b.dataVencimento).getTime(),
    );

  const totalAberto = despesas
    .filter((l) => l.status === "Aberto")
    .reduce((acc, curr) => acc + curr.valor, 0);
  const totalAtrasado = despesas
    .filter((l) => l.status === "Atrasado" && !(l as any).isPrevisao)
    .reduce((acc, curr) => acc + curr.valor, 0);
  const totalPago = despesas
    .filter((l) => l.status === "Pago" && !(l as any).isPrevisao)
    .reduce((acc, curr) => acc + curr.valor, 0);

  const handleEfetivar = (prev: any) => {
    if (onEfetivar) {
      onEfetivar(prev);
    } else {
      alert("Redirecionando para Lançamentos...");
    }
  };

  return (
    <div className="p-8 w-full h-full flex flex-col space-y-6 overflow-hidden max-w-7xl mx-auto">
      <header className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-semibold text-zinc-900 tracking-tight">
            Contas a Pagar
          </h1>
          <p className="text-zinc-500 mt-1">
            Gerenciamento de vencimentos e pagamentos.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          disabled={isAdding}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <Plus size={16} />
          Nova Conta
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
            <Clock className="text-amber-600" size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500">A Vencer</p>
            <p className="text-2xl font-semibold text-zinc-900">
              {formatCurrency(totalAberto)}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
            <AlertCircle className="text-rose-600" size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500">Atrasadas</p>
            <p className="text-2xl font-semibold text-rose-600">
              {formatCurrency(totalAtrasado)}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="text-emerald-600" size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500">Pagas</p>
            <p className="text-2xl font-semibold text-emerald-600">
              {formatCurrency(totalPago)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="p-4 border-b border-zinc-200 flex items-center gap-2 bg-zinc-50/50 shrink-0">
          {["Todos", "Aberto", "Atrasado", "Pago"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filterStatus === status
                ? "bg-zinc-900 text-white"
                : "bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto overflow-y-auto flex-1">
          <table className="min-w-[1040px] w-full table-fixed text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-zinc-50 shadow-[inset_0_-1px_0_rgba(228,228,231,1)]">
              <tr className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                <th className="p-4 w-[120px]">Vencimento</th>
                <th className="p-4 w-[250px]">Descrição</th>
                <th className="p-4 w-[150px]">Fornecedor</th>
                <th className="p-4 w-[180px]">Centro de Custo</th>
                <th className="p-4 text-right w-[120px]">Valor</th>
                <th className="p-4 text-center w-[110px]">Status</th>
                <th className="p-4 text-right w-[110px]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {isAdding && (
                <tr className="bg-indigo-50/30">
                  <td className="p-2">
                    <input
                      type="date"
                      value={newConta.dataVencimento}
                      onChange={(e) => setNewConta({ ...newConta, dataVencimento: e.target.value })}
                      className="w-full p-2 bg-white border border-zinc-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      placeholder="Descrição"
                      value={newConta.descricao}
                      onChange={(e) => setNewConta({ ...newConta, descricao: e.target.value })}
                      className="w-full p-2 bg-white border border-zinc-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      list="fornecedores-list"
                      placeholder="Fornecedor"
                      value={newConta.fornecedorNome}
                      onChange={(e) => setNewConta({ ...newConta, fornecedorNome: e.target.value })}
                      className="w-full p-2 bg-white border border-zinc-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                    <datalist id="fornecedores-list">
                      {[...fornecedores].sort((a, b) => a.nome.localeCompare(b.nome)).map(f => <option key={f.id} value={f.nome} />)}
                    </datalist>
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      list="obras-list"
                      placeholder="Centro de Custo"
                      value={newConta.obraNome}
                      onChange={(e) => setNewConta({ ...newConta, obraNome: e.target.value })}
                      className="w-full p-2 bg-white border border-zinc-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                    <datalist id="obras-list">
                      {[...obras].sort((a, b) => a.nome.localeCompare(b.nome)).map(o => <option key={o.id} value={o.nome} />)}
                    </datalist>
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      placeholder="R$ 0,00"
                      value={valorInput}
                      onChange={handleValorChange}
                      className="w-full p-2 bg-white border border-zinc-300 rounded text-xs text-right focus:ring-1 focus:ring-indigo-500 outline-none font-semibold"
                    />
                  </td>
                  <td className="p-2 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      Aberto
                    </span>
                  </td>
                  <td className="p-2 text-center">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={handleSaveNewConta} className="p-1.5 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors">
                        <Check size={14} />
                      </button>
                      <button onClick={handleCancelNewConta} className="p-1.5 bg-rose-500 text-white rounded hover:bg-rose-600 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {filtered.map((l) => {
                const fornecedor = fornecedores.find(
                  (f) => f.id === l.fornecedorId,
                );
                const obra = obras.find(
                  (o) => o.id === l.obraId || o.nome === l.obraId
                );
                return (
                  <tr key={l.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="p-4 text-sm font-medium text-zinc-900 whitespace-nowrap">
                      {safeFormatDate(l.dataVencimento)}
                    </td>
                    <td className="p-4 text-sm text-zinc-600 break-words whitespace-normal">{l.descricao}</td>
                    <td className="p-4 text-sm text-zinc-600 break-words whitespace-normal">
                      {fornecedor?.nome || "-"}
                    </td>
                    <td className="p-4 text-sm text-zinc-600 break-words whitespace-normal">
                      {obra?.nome || l.obraId || "-"}
                    </td>
                    <td className="p-4 text-sm font-semibold text-zinc-900 text-right whitespace-nowrap">
                      {formatCurrency(l.valor)}
                    </td>
                    <td className="p-4 text-center select-none cursor-default" title={(l as any).isPrevisao ? "Esta é uma previsão de contrato. Confirme os valores para efetivar e enviar ao Lançamentos." : ""}>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                        ${l.status === "Pago"
                            ? "bg-emerald-100 text-emerald-800"
                            : l.status === "Atrasado"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          } ${(l as any).isPrevisao ? "border border-amber-300 border-dashed" : ""}`}
                      >
                        {l.status} {(l as any).isPrevisao && <span className="ml-1 opacity-70 italic">- Previsão</span>}
                      </span>
                    </td>
                    <td className="p-4 text-right whitespace-nowrap">
                      {l.status !== "Pago" ? (
                        (l as any).isPrevisao ? (
                           <button onClick={() => handleEfetivar(l)} className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 font-medium hover:bg-emerald-100 transition-colors">
                             Efetivar
                           </button>
                         ) : (
                           <button onClick={() => handlePagar(l.id)} className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-200 font-medium hover:bg-indigo-100 transition-colors">
                             Pagar
                           </button>
                         )
                      ) : (
                        !(l as any).isPrevisao && (
                          <button onClick={() => handleDesfazerPagamento(l.id)} className="text-xs text-rose-600 bg-rose-50 px-2 py-1 rounded border border-rose-200 font-medium hover:bg-rose-100 transition-colors">
                            Desfazer
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-8 text-center text-zinc-500">
              Nenhuma conta encontrada para o filtro selecionado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
