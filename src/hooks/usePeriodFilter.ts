import { useState, useMemo } from "react";
import { safeFormatDate } from "../utils";

export interface ActiveFilter {
  type: string;
  start: string;
  end: string;
  label: string;
  month?: number;
  year?: number;
  date?: string;
  startDate?: string;
  endDate?: string;
}

export function usePeriodFilter(
  defaultMonth = new Date().getMonth(), 
  defaultYear = new Date().getFullYear()
) {
  const monthNames = useMemo(
    () => ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"],
    []
  );

  const initialFilter = useMemo(() => {
    const monthStr = String(defaultMonth + 1).padStart(2, "0");
    const start = `${defaultYear}-${monthStr}-01`;
    const lastDay = new Date(defaultYear, defaultMonth + 1, 0).getDate();
    const end = `${defaultYear}-${monthStr}-${String(lastDay).padStart(2, "0")}`;
    return {
      type: "mes",
      start,
      end,
      label: `${monthNames[defaultMonth]} ${defaultYear}`,
      month: defaultMonth,
      year: defaultYear
    };
  }, [monthNames, defaultMonth, defaultYear]);

  const [activeFilter, setActiveFilter] = useState<ActiveFilter | null>(initialFilter);
  const [showPeriodModal, setShowPeriodModal] = useState(false);

  const [tempPeriodType, setTempPeriodType] = useState<"personalizado" | "dia" | "semana" | "mes" | "ano">("mes");
  const [tempMonth, setTempMonth] = useState(defaultMonth);
  const [tempYear, setTempYear] = useState(defaultYear);
  
  // Set defaults for temp dates
  const defaultDate = `${defaultYear}-${String(defaultMonth + 1).padStart(2, "0")}-01`;
  const [tempDate, setTempDate] = useState(defaultDate);
  const [tempStartDate, setTempStartDate] = useState(defaultDate);
  const [tempEndDate, setTempEndDate] = useState(defaultDate);

  const handleNavigatePeriod = (direction: "prev" | "next") => {
    if (!activeFilter) return;

    let newFilter = { ...activeFilter };

    if (activeFilter.type === "mes") {
      let currentMonth = activeFilter.month ?? defaultMonth;
      let currentYear = activeFilter.year ?? defaultYear;

      if (direction === "prev") {
        currentMonth -= 1;
        if (currentMonth < 0) {
          currentMonth = 11;
          currentYear -= 1;
        }
      } else {
        currentMonth += 1;
        if (currentMonth > 11) {
          currentMonth = 0;
          currentYear += 1;
        }
      }

      const monthStr = String(currentMonth + 1).padStart(2, "0");
      const start = `${currentYear}-${monthStr}-01`;
      const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
      const end = `${currentYear}-${monthStr}-${String(lastDay).padStart(2, "0")}`;

      newFilter = {
        ...newFilter,
        start,
        end,
        label: `${monthNames[currentMonth]} ${currentYear}`,
        month: currentMonth,
        year: currentYear
      };

      setTempMonth(currentMonth);
      setTempYear(currentYear);
    } else if (activeFilter.type === "dia") {
      const currentDateStr = activeFilter.date || activeFilter.start;
      const refDate = new Date(currentDateStr + "T00:00:00");
      refDate.setDate(refDate.getDate() + (direction === "prev" ? -1 : 1));
      const formattedDate = refDate.toISOString().split("T")[0];

      newFilter = {
        ...newFilter,
        start: formattedDate,
        end: formattedDate,
        label: safeFormatDate(formattedDate),
        date: formattedDate
      };
      setTempDate(formattedDate);
    } else if (activeFilter.type === "semana") {
      const currentStartStr = activeFilter.startDate || activeFilter.start;
      const refDate = new Date(currentStartStr + "T00:00:00");
      refDate.setDate(refDate.getDate() + (direction === "prev" ? -7 : 7));
      
      const day = refDate.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(refDate);
      monday.setDate(refDate.getDate() + diffToMonday);
      
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const formatYMD = (d: Date) => d.toISOString().split("T")[0];
      const start = formatYMD(monday);
      const end = formatYMD(sunday);

      newFilter = {
        ...newFilter,
        start,
        end,
        label: `Semana de ${safeFormatDate(start)} a ${safeFormatDate(end)}`,
        startDate: start,
        endDate: end
      };
      setTempDate(start);
    } else if (activeFilter.type === "ano") {
      let currentYear = activeFilter.year ?? defaultYear;
      currentYear += (direction === "prev" ? -1 : 1);

      newFilter = {
        ...newFilter,
        start: `${currentYear}-01-01`,
        end: `${currentYear}-12-31`,
        label: `Ano ${currentYear}`,
        year: currentYear
      };
      setTempYear(currentYear);
    } else if (activeFilter.type === "personalizado") {
      const startD = new Date(activeFilter.start + "T00:00:00");
      const endD = new Date(activeFilter.end + "T00:00:00");
      const diffTime = Math.abs(endD.getTime() - startD.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      const delta = direction === "prev" ? -diffDays : diffDays;
      startD.setDate(startD.getDate() + delta);
      endD.setDate(endD.getDate() + delta);

      const formatYMD = (d: Date) => d.toISOString().split("T")[0];
      const start = formatYMD(startD);
      const end = formatYMD(endD);

      newFilter = {
        ...newFilter,
        start,
        end,
        label: `${safeFormatDate(start)} a ${safeFormatDate(end)}`
      };
      setTempStartDate(start);
      setTempEndDate(end);
    }

    setActiveFilter(newFilter);
  };

  const handleConfirmPeriod = () => {
    let start = "";
    let end = "";
    let label = "";
    let extra: any = {};

    if (tempPeriodType === "mes") {
      label = `${monthNames[tempMonth]} ${tempYear}`;
      const monthStr = String(tempMonth + 1).padStart(2, "0");
      start = `${tempYear}-${monthStr}-01`;
      const lastDay = new Date(tempYear, tempMonth + 1, 0).getDate();
      end = `${tempYear}-${monthStr}-${String(lastDay).padStart(2, "0")}`;
      extra = { month: tempMonth, year: tempYear };
    } else if (tempPeriodType === "dia") {
      if (!tempDate) {
        alert("Por favor, selecione uma data.");
        return;
      }
      label = safeFormatDate(tempDate);
      start = tempDate;
      end = tempDate;
      extra = { date: tempDate };
    } else if (tempPeriodType === "semana") {
      if (!tempDate) {
        alert("Por favor, selecione uma data.");
        return;
      }
      const refDate = new Date(tempDate + "T00:00:00");
      const day = refDate.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(refDate);
      monday.setDate(refDate.getDate() + diffToMonday);
      
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const formatYMD = (d: Date) => d.toISOString().split("T")[0];
      start = formatYMD(monday);
      end = formatYMD(sunday);
      label = `Semana de ${safeFormatDate(start)} a ${safeFormatDate(end)}`;
      extra = { startDate: start, endDate: end };
    } else if (tempPeriodType === "ano") {
      label = `Ano ${tempYear}`;
      start = `${tempYear}-01-01`;
      end = `${tempYear}-12-31`;
      extra = { year: tempYear };
    } else if (tempPeriodType === "personalizado") {
      if (!tempStartDate || !tempEndDate) {
        alert("Por favor, selecione as datas de início e fim.");
        return;
      }
      if (tempStartDate > tempEndDate) {
        alert("A data de início não pode ser posterior à data de término.");
        return;
      }
      label = `${safeFormatDate(tempStartDate)} a ${safeFormatDate(tempEndDate)}`;
      start = tempStartDate;
      end = tempEndDate;
    }

    setActiveFilter({ type: tempPeriodType, start, end, label, ...extra });
    setShowPeriodModal(false);
  };

  return {
    monthNames,
    activeFilter,
    setActiveFilter,
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
  };
}
