// ======= CONFIGURAÇÃO DO SUPABASE =======
// Substitua pelos valores do seu projeto:
const SUPABASE_URL = "https://flalhcrfneubfhyzqbxe.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsYWxoY3JmbmV1YmZoeXpxYnhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MjU2NTEsImV4cCI6MjA3MTIwMTY1MX0.LwYrDgtofJaDfvofHcUeZYnUh0SBk_UxXh2HQgiCwFI";

const headers = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json"
};

async function sFetch(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Erro Supabase: ${res.status} ${msg}`);
  }

  if (res.status === 204) {
    return null; // DELETE não tem corpo
  }

  return res.json();
}

const api = {
  // ==========================
  // RECEITAS
  // ==========================
  async listarReceitas(termo = '') {
  let url = `${SUPABASE_URL}/rest/v1/receita?select=*`;

  if (termo) {
    // Aqui usamos filtro `ilike` do Supabase para busca "case-insensitive" por nome
    const query = encodeURIComponent(`nome.ilike.%${termo}%`);
    url += `&${query}`;
  }

  return sFetch(url, { headers });
},

  async obterReceita(id) {
    return sFetch(`${SUPABASE_URL}/rest/v1/receita?id=eq.${id}&select=*,ingrediente(*)`, { headers });
  },

  async criarReceita(data) {
    return sFetch(`${SUPABASE_URL}/rest/v1/receita`, {
      method: "POST",
      headers: {
        ...headers,
        Prefer: "return=representation"
      },
      body: JSON.stringify(data)
    });
  },

  async atualizarReceita(id, data) {
    return sFetch(`${SUPABASE_URL}/rest/v1/receita?id=eq.${id}`, {
      method: "PATCH",
      headers: {
        ...headers,
        Prefer: "return=representation"
      },
      body: JSON.stringify(data)
    });
  },

  async deletarReceita(id) {
    return sFetch(`${SUPABASE_URL}/rest/v1/receita?id=eq.${id}`, {
      method: "DELETE",
      headers
    });
  },

  // ==========================
  // INGREDIENTES
  // ==========================
  async listarIngredientes(receitaId) {
    return sFetch(`${SUPABASE_URL}/rest/v1/ingrediente?receita_id=eq.${receitaId}&select=*`, {
      headers
    });
  },
  async criarIngredientes(receitaId, itens) {
    const dados = itens.map(x => ({
      receita_id: receitaId,
      nome: x.nome,
      qtde: x.qtde || null
    }));
    return sFetch(`${SUPABASE_URL}/rest/v1/ingrediente`, {
      method: "POST",
      headers: {
        ...headers,
        Prefer: "return=representation"
      },
      body: JSON.stringify(dados)
    });
  },

  async atualizarIngredientes(receitaId, itens) {
  // Estratégia simples: apaga todos e recria
  await sFetch(`${SUPABASE_URL}/rest/v1/ingrediente?receita_id=eq.${receitaId}`, {
    method: "DELETE",
    headers
  });
  if (itens.length > 0) {
    return this.criarIngredientes(receitaId, itens);
  }
  return [];
},

  // ==========================
  // COMPOSTOS (RECEITA + INGREDIENTES) 
  // ==========================
  async criarReceitaCompleta(data, ingredientes) {
    try {
      const novaReceita = await this.criarReceita(data);
      if (!novaReceita || !novaReceita[0]?.id) {
        throw new Error("Resposta inválida do Supabase ao criar receita.");
      }
      const receitaId = novaReceita[0].id;
      let novosIngredientes = [];
      if (ingredientes?.length) {
        novosIngredientes = await this.criarIngredientes(receitaId, ingredientes);
      }
      return { ...novaReceita[0], ingredientes: novosIngredientes };
    } catch (err) {
      console.error("Erro criarReceitaCompleta:", err);
      throw new Error("Não foi possível criar a receita.");
    }
  },

  async atualizarReceitaCompleta(receitaId, data, ingredientes) {
    try {
      const receitaAtualizada = await this.atualizarReceita(receitaId, data);
      let novosIngredientes = [];
      if (ingredientes) {
        novosIngredientes = await this.atualizarIngredientes(receitaId, ingredientes);
      }
      return { ...receitaAtualizada[0], ingredientes: novosIngredientes };
    } catch (err) {
      console.error("Erro atualizarReceitaCompleta:", err);
      throw new Error("Não foi possível atualizar a receita.");
    }
  }
};
