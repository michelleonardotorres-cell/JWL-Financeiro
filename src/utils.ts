import { format, parseISO } from "date-fns";

export function safeFormatDate(dateStr?: string, formatStr = "dd/MM/yyyy", fallback = "-"): string {
  if (!dateStr) return fallback;
  try {
    // Evitar shift de timezone caso venha como ISO string da meia noite UTC
    const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const [year, month, day] = datePart.split('-');
    if (year && month && day) {
        const parsed = new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0);
        return format(parsed, formatStr);
    }
    const parsed = parseISO(dateStr);
    if (isNaN(parsed.getTime())) return dateStr;
    return format(parsed, formatStr);
  } catch (e) {
    console.error("Error formatting date:", dateStr, e);
    return dateStr || fallback;
  }
}

export function safeParseISO(dateStr?: string): Date | null {
  if (!dateStr) return null;
  try {
    const parsed = parseISO(dateStr);
    return isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
}

export function normalizeString(str?: string): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export async function fetchCep(cep: string) {
  const cleanCep = cep.replace(/\D/g, '');
  if (cleanCep.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    const data = await res.json();
    if (data.erro) return null;
    return {
      endereco: data.logradouro || '',
      bairro: data.bairro || '',
      cidade: data.localidade || '',
      estado: data.uf || ''
    };
  } catch (e) {
    return null;
  }
}

export async function fetchCnpj(cnpj: string) {
  const cleanCnpj = cnpj.replace(/\D/g, '');
  if (cleanCnpj.length !== 14) return null;
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
    const data = await res.json();
    if (data.message) return null;
    return {
      nome: data.razao_social || '',
      nomeFantasia: data.nome_fantasia || '',
      cep: data.cep || '',
      endereco: data.logradouro || '',
      numero: data.numero || '',
      complemento: data.complemento || '',
      bairro: data.bairro || '',
      cidade: data.municipio || '',
      estado: data.uf || '',
      telefone1: data.ddd_telefone_1 || ''
    };
  } catch (e) {
    return null;
  }
}
