-- Table: obras
CREATE TABLE IF NOT EXISTS obras (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Em Andamento', 'Concluída', 'Planejamento'))
);

-- Table: fornecedores
CREATE TABLE IF NOT EXISTS fornecedores (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    cnpj TEXT NOT NULL
);

-- Table: lancamentos
CREATE TABLE IF NOT EXISTS lancamentos (
    id TEXT PRIMARY KEY,
    data_competencia DATE NOT NULL,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    forma_pagamento TEXT,
    nf TEXT,
    descricao TEXT NOT NULL,
    valor NUMERIC(15, 2) NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('Receita', 'Despesa')),
    categoria TEXT NOT NULL,
    tipo_lancamento TEXT,
    subtipo TEXT,
    obra_id TEXT REFERENCES obras(id) ON DELETE SET NULL,
    fornecedor_id TEXT REFERENCES fornecedores(id) ON DELETE SET NULL,
    recebedor_fornecedor TEXT,
    contrato_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('Aberto', 'Pago', 'Atrasado'))
);

-- Table: contratos
CREATE TABLE IF NOT EXISTS contratos (
    id TEXT PRIMARY KEY,
    descricao TEXT NOT NULL,
    valor_previsto NUMERIC(15, 2) NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('Receita', 'Despesa')),
    categoria TEXT NOT NULL,
    tipo_lancamento TEXT,
    subtipo TEXT,
    obra_id TEXT REFERENCES obras(id) ON DELETE SET NULL,
    fornecedor_id TEXT REFERENCES fornecedores(id) ON DELETE SET NULL,
    recebedor_fornecedor TEXT,
    dia_vencimento INTEGER NOT NULL CHECK (dia_vencimento BETWEEN 1 AND 31),
    ativo BOOLEAN NOT NULL DEFAULT TRUE
);

-- Row Level Security (RLS) Configuration (Optional - standard Supabase tables require RLS enabled or disabled)
ALTER TABLE obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE lancamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for simple client-side calls (disable this for production security)
CREATE POLICY "Allow public read access on obras" ON obras FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on obras" ON obras FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on obras" ON obras FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on obras" ON obras FOR DELETE USING (true);

CREATE POLICY "Allow public read access on fornecedores" ON fornecedores FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on fornecedores" ON fornecedores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on fornecedores" ON fornecedores FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on fornecedores" ON fornecedores FOR DELETE USING (true);

CREATE POLICY "Allow public read access on lancamentos" ON lancamentos FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on lancamentos" ON lancamentos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on lancamentos" ON lancamentos FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on lancamentos" ON lancamentos FOR DELETE USING (true);

CREATE POLICY "Allow public read access on contratos" ON contratos FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on contratos" ON contratos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on contratos" ON contratos FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on contratos" ON contratos FOR DELETE USING (true);


-- ========================================================
-- Seed Mock Data
-- ========================================================

-- Obras
INSERT INTO obras (id, nome, status) VALUES
('o1', 'Residencial Alpha', 'Em Andamento'),
('o2', 'Edifício Beta', 'Em Andamento'),
('o3', 'Condomínio Ômega', 'Planejamento')
ON CONFLICT (id) DO NOTHING;

-- Fornecedores
INSERT INTO fornecedores (id, nome, cnpj) VALUES
('f1', 'Cimento & Cia', '11.222.333/0001-44'),
('f2', 'Aço Forte S.A.', '55.666.777/0001-88'),
('f3', 'Locadora de Máquinas', '99.000.111/0001-22'),
('f4', 'Empreiteira Silva', '33.444.555/0001-66')
ON CONFLICT (id) DO NOTHING;

-- Lançamentos
INSERT INTO lancamentos (id, data_competencia, data_vencimento, data_pagamento, forma_pagamento, nf, recebedor_fornecedor, descricao, tipo_lancamento, subtipo, valor, tipo, categoria, obra_id, fornecedor_id, status) VALUES
('l18', '2024-11-13', '2024-11-13', '2024-11-13', 'A VISTA', 'SN', 'VALCIMAR COSTA BELTRAO', '50% SERVIÇO DIVISORIAIS', 'CUSTO VARIÁVEL', 'MAO DE OBRA', 550.00, 'Despesa', 'Mão de Obra', 'o1', NULL, 'Pago'),
('l19', '2024-11-13', '2024-11-13', '2024-11-13', 'A VISTA', 'SN', 'CREA - AM', 'ART SERVIÇO TRE GALPÃO', 'DESPESAS ADMINISTRATIVAS', 'TAXAS', 99.64, 'Despesa', 'Despesas Administrativas', 'o1', NULL, 'Pago'),
('l20', '2024-11-14', '2024-11-14', '2024-11-14', 'A VISTA', '12345', 'JOHN WELLISSON MENCONÇA TORRES', 'COPIAS DA CHAVES', 'DESPESAS ADMINISTRATIVAS', 'DESPESAS', 30.00, 'Despesa', 'Despesas Administrativas', 'o2', NULL, 'Pago'),
('l1', '2023-10-01', '2023-10-05', '2023-10-05', NULL, NULL, NULL, 'Venda Apto 101', NULL, NULL, 350000.00, 'Receita', 'Receitas de Vendas', 'o1', NULL, 'Pago'),
('l2', '2023-11-01', '2023-11-05', '2023-11-05', NULL, NULL, NULL, 'Venda Apto 202', NULL, NULL, 420000.00, 'Receita', 'Receitas de Vendas', 'o2', NULL, 'Pago'),
('l3', '2023-12-01', '2023-12-05', '2023-12-05', NULL, NULL, NULL, 'Venda Apto 303', NULL, NULL, 380000.00, 'Receita', 'Receitas de Vendas', 'o1', NULL, 'Pago'),
('l4', '2024-01-01', '2024-01-05', '2024-01-05', NULL, NULL, NULL, 'Venda Apto 404', NULL, NULL, 450000.00, 'Receita', 'Receitas de Vendas', 'o2', NULL, 'Pago'),
('l5', '2024-02-01', '2024-02-05', '2024-02-05', NULL, NULL, NULL, 'Venda Apto 505', NULL, NULL, 360000.00, 'Receita', 'Receitas de Vendas', 'o1', NULL, 'Pago'),
('l6', '2024-03-01', '2024-03-05', '2024-03-05', NULL, NULL, NULL, 'Venda Apto 606', NULL, NULL, 480000.00, 'Receita', 'Receitas de Vendas', 'o2', NULL, 'Pago'),
('l7', '2024-03-10', '2024-03-25', '2024-03-25', NULL, NULL, NULL, 'Cimento CP II', NULL, NULL, 15000.00, 'Despesa', 'Materiais', 'o1', 'f1', 'Pago'),
('l8', '2024-03-15', '2024-04-05', NULL, NULL, NULL, NULL, 'Vergalhões 10mm', NULL, NULL, 28000.00, 'Despesa', 'Materiais', 'o2', 'f2', 'Aberto'),
('l9', '2024-03-20', '2024-04-10', NULL, NULL, NULL, NULL, 'Areia e Brita', NULL, NULL, 8500.00, 'Despesa', 'Materiais', 'o1', 'f1', 'Aberto'),
('l10', '2024-03-01', '2024-03-05', '2024-03-05', NULL, NULL, NULL, 'Folha de Pagamento - Março', NULL, NULL, 45000.00, 'Despesa', 'Mão de Obra', 'o1', NULL, 'Pago'),
('l11', '2024-03-01', '2024-03-05', '2024-03-05', NULL, NULL, NULL, 'Folha de Pagamento - Março', NULL, NULL, 62000.00, 'Despesa', 'Mão de Obra', 'o2', NULL, 'Pago'),
('l12', '2024-03-15', '2024-03-20', '2024-03-20', NULL, NULL, NULL, 'Empreiteira - Fundação', NULL, NULL, 120000.00, 'Despesa', 'Mão de Obra', 'o2', 'f4', 'Pago'),
('l13', '2024-03-05', '2024-03-15', '2024-03-15', NULL, NULL, NULL, 'Locação de Grua', NULL, NULL, 18000.00, 'Despesa', 'Equipamentos', 'o2', 'f3', 'Pago'),
('l14', '2024-03-25', '2024-04-05', NULL, NULL, NULL, NULL, 'Locação de Betoneiras', NULL, NULL, 5400.00, 'Despesa', 'Equipamentos', 'o1', 'f3', 'Aberto'),
('l15', '2024-02-28', '2024-03-20', '2024-03-20', NULL, NULL, NULL, 'ISS', NULL, NULL, 12500.00, 'Despesa', 'Impostos', 'o1', NULL, 'Pago'),
('l16', '2024-03-31', '2024-04-20', NULL, NULL, NULL, NULL, 'ISS', NULL, NULL, 15800.00, 'Despesa', 'Impostos', 'o2', NULL, 'Aberto'),
('l17', '2024-02-15', '2024-03-01', NULL, NULL, NULL, NULL, 'Aço Estrutural', NULL, NULL, 32000.00, 'Despesa', 'Materiais', 'o2', 'f2', 'Atrasado')
ON CONFLICT (id) DO NOTHING;

-- Contratos
INSERT INTO contratos (id, descricao, valor_previsto, tipo, categoria, tipo_lancamento, subtipo, obra_id, fornecedor_id, recebedor_fornecedor, dia_vencimento, ativo) VALUES
('c1', 'Aluguel Trator', 15000.00, 'Despesa', 'Equipamentos', 'CUSTO FIXO', 'ALUGUEL', 'o1', 'f3', 'Locadora de Máquinas', 10, TRUE),
('c2', 'Conta de Água', 350.00, 'Despesa', 'Despesas Administrativas', 'CUSTO VARIÁVEL', 'CONSUMO', 'o2', NULL, 'Manaus Ambiental', 15, TRUE)
ON CONFLICT (id) DO NOTHING;
