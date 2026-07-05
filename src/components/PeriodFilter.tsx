import React from "react";

export function PeriodFilter({ filterState }: { filterState: any }) {
  const {
    monthNames,
    activeFilter,
    showPeriodModal,
    setShowPeriodModal,
    tempPeriodType,
    setTempPeriodType,
    tempMonth,
    setTempMonth,
    tempYear,
    setTempYear,
    tempDate,
    setTempDate,
    tempStartDate,
    setTempStartDate,
    tempEndDate,
    setTempEndDate,
    handleNavigatePeriod,
    handleConfirmPeriod
  } = filterState;

  return (
    <>
      <div className="flex items-stretch rounded-lg border border-zinc-300 bg-white overflow-hidden shadow-sm shrink-0">
        <button
          type="button"
          onClick={() => handleNavigatePeriod("prev")}
          className="px-3 py-2 border-r border-zinc-200 hover:bg-zinc-50 text-zinc-600 transition-colors flex items-center justify-center"
          title="Período anterior"
        >
          <span className="text-sm font-semibold select-none">&lt;</span>
        </button>
        <button
          type="button"
          onClick={() => setShowPeriodModal(true)}
          className="px-4 py-2 hover:bg-zinc-50 text-zinc-700 text-sm font-medium transition-colors min-w-[130px] text-center"
          title="Alterar período de visualização"
        >
          {activeFilter ? activeFilter.label : "Selecionar período"}
        </button>
        <button
          type="button"
          onClick={() => handleNavigatePeriod("next")}
          className="px-3 py-2 border-l border-zinc-200 hover:bg-zinc-50 text-zinc-600 transition-colors flex items-center justify-center"
          title="Próximo período"
        >
          <span className="text-sm font-semibold select-none">&gt;</span>
        </button>
      </div>

      {showPeriodModal && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setShowPeriodModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-[480px] w-full p-6 shadow-xl space-y-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-medium text-zinc-900 border-b border-zinc-100 pb-3">
              Alterar período de visualização
            </h3>
            <div className="flex gap-6 min-h-[250px] items-start pt-2">
              {/* Radio Group Left */}
              <div className="w-[42%] flex flex-col gap-5 pr-2">
                {[
                  { value: "personalizado", label: "Personalizado" },
                  { value: "dia", label: "Por dia" },
                  { value: "semana", label: "Por semana" },
                  { value: "mes", label: "Por mês" },
                  { value: "ano", label: "Por ano" },
                ].map((type) => {
                  const isChecked = tempPeriodType === type.value;
                  return (
                    <label key={type.value} className="flex items-center gap-3 cursor-pointer select-none text-zinc-800 text-sm font-normal">
                      <input
                        type="radio"
                        name="periodType"
                        checked={isChecked}
                        onChange={() => setTempPeriodType(type.value as any)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${isChecked ? 'border-blue-600' : 'border-zinc-400'}`}>
                        {isChecked && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                      </div>
                      <span>{type.label}</span>
                    </label>
                  );
                })}
              </div>

              {/* Controls Right */}
              <div className="w-[58%] pl-2">
                {tempPeriodType === "mes" && (
                  <div className="space-y-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-zinc-400 font-normal">Selecione um mês</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm font-semibold text-zinc-800 capitalize">
                          {monthNames[tempMonth]} {tempYear}
                        </span>
                        <button onClick={() => setTempYear((y: number) => y - 1)} className="px-1.5 py-0.5 hover:bg-zinc-100 rounded text-zinc-500 font-bold text-xs select-none" title="Ano anterior">&lt;</button>
                        <button onClick={() => setTempYear((y: number) => y + 1)} className="px-1.5 py-0.5 hover:bg-zinc-100 rounded text-zinc-500 font-bold text-xs select-none" title="Próximo ano">&gt;</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {monthNames.map((m: string, i: number) => (
                        <button
                          key={m}
                          onClick={() => setTempMonth(i)}
                          className={`p-1.5 rounded-md text-xs font-medium transition-colors ${tempMonth === i ? "bg-blue-600 text-white shadow-sm" : "text-zinc-600 hover:bg-zinc-100"}`}
                        >
                          {m.substring(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {tempPeriodType === "dia" && (
                  <div className="flex flex-col">
                    <span className="text-xs text-zinc-500 font-normal mb-1.5">Selecione uma data</span>
                    <input
                      type="date"
                      value={tempDate}
                      onChange={(e) => setTempDate(e.target.value)}
                      className="p-2 border border-zinc-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none w-full"
                    />
                  </div>
                )}
                {tempPeriodType === "semana" && (
                  <div className="flex flex-col">
                    <span className="text-xs text-zinc-500 font-normal mb-1.5">Selecione um dia da semana</span>
                    <input
                      type="date"
                      value={tempDate}
                      onChange={(e) => setTempDate(e.target.value)}
                      className="p-2 border border-zinc-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none w-full"
                    />
                    <p className="text-xs text-zinc-400 mt-2">A semana de segunda a domingo será selecionada automaticamente.</p>
                  </div>
                )}
                {tempPeriodType === "ano" && (
                  <div className="flex flex-col">
                    <span className="text-xs text-zinc-500 font-normal mb-1.5">Selecione o ano</span>
                    <div className="flex items-center gap-4">
                      <button onClick={() => setTempYear((y: number) => y - 1)} className="px-2 py-1 bg-zinc-100 hover:bg-zinc-200 rounded text-zinc-700 font-bold">&lt;</button>
                      <span className="text-lg font-semibold text-zinc-800">{tempYear}</span>
                      <button onClick={() => setTempYear((y: number) => y + 1)} className="px-2 py-1 bg-zinc-100 hover:bg-zinc-200 rounded text-zinc-700 font-bold">&gt;</button>
                    </div>
                  </div>
                )}
                {tempPeriodType === "personalizado" && (
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col">
                      <span className="text-xs text-zinc-500 font-normal mb-1.5">Data Inicial</span>
                      <input
                        type="date"
                        value={tempStartDate}
                        onChange={(e) => setTempStartDate(e.target.value)}
                        className="p-2 border border-zinc-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none w-full"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-zinc-500 font-normal mb-1.5">Data Final</span>
                      <input
                        type="date"
                        value={tempEndDate}
                        onChange={(e) => setTempEndDate(e.target.value)}
                        className="p-2 border border-zinc-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none w-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end mt-4 pt-4 border-t border-zinc-100">
              <button
                onClick={handleConfirmPeriod}
                className="w-full bg-green-700 hover:bg-green-800 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
              >
                Confirmar período
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
