import React from "react";
import { Users } from "lucide-react";

export default function Recebedores() {
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-emerald-500/10 rounded-xl">
          <Users className="text-emerald-500" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Recebedores</h1>
          <p className="text-zinc-500">Gestão de recebedores (Em desenvolvimento)</p>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-zinc-200 p-8 text-center text-zinc-500">
        Esta página está em desenvolvimento.
      </div>
    </div>
  );
}
