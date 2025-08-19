// ======= CONFIGURAÇÃO DO SUPABASE =======
// Substitua pelos valores do seu projeto:
const SUPABASE_URL = "https://flalhcrfneubfhyzqbxe.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsYWxoY3JmbmV1YmZoeXpxYnhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MjU2NTEsImV4cCI6MjA3MTIwMTY1MX0.LwYrDgtofJaDfvofHcUeZYnUh0SBk_UxXh2HQgiCwFI";

// Cabeçalhos padrão para REST
const headers = {
  "apikey": SUPABASE_KEY,
  "Authorization": "Bearer " + SUPABASE_KEY,
  "Content-Type": "application/json"
};

// Função utilitária para fetch com tratamento de erro
async function sFetch(url, options = {}) {
  const resp = await fetch(url, { headers, ...options });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => '');
    console.error('Erro REST', resp.status, txt);
    throw new Error('Falha na chamada REST: ' + resp.status);
  }
  const contentType = resp.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return resp.json();
  return resp.text();
}

// API pública da aplicação
const api = {
  // Receitas
  async listarReceitas(termo = '') {
    if (!termo) {
      return sFetch(`${SUPABASE_URL}/rest/v1/receita?select=*&order=criado_em.desc`);
    } else {
      const nomeQuery = `${SUPABASE_URL}/rest/v1/receita?select=*&nome=ilike.*${encodeURIComponent(termo)}*&order=criado_em.desc`;
      const receitasPorNome = await sFetch(nomeQuery);

      const ingQuery = `${SUPABASE_URL}/rest/v1/ingrediente?select=receita_id&nome=ilike.*${encodeURIComponent(termo)}*`;
      const ing = await sFetch(ingQuery);
      const idsIng = [...new Set(ing.map(i => i.receita_id))];
      const byIds = idsIng.length
        ? await sFetch(`${SUPABASE_URL}/rest/v1/receita?select=*&id=in.(${idsIng.join(',')})`)
        : [];

      const map = new Map();
      [...receitasPorNome, ...byIds].forEach(r => map.set(r.id, r));
      return Array.from(map.values()).sort((a,b) => (new Date(b.criado_em||0)) - (new Date(a.criado_em||0)));
    }
  },

  async obterReceita(id) {
    const res = await sFetch(`${SUPABASE_URL}/rest/v1/receita?select=*&id=eq.${id}`);
    return res[0] || null;
  },

async criarReceita(data) {
  return sFetch(`${SUPABASE_URL}/rest/v1/receita`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=representation' }, // <- aqui
    body: JSON.stringify(data)
  });
}

  async deletarReceita(id) {
    return sFetch(`${SUPABASE_URL}/rest/v1/receita?id=eq.${id}`, {
      method: 'DELETE'
    });
  },

  // Ingredientes
  async listarIngredientes(receitaId) {
    return sFetch(`${SUPABASE_URL}/rest/v1/ingrediente?select=*&receita_id=eq.${receitaId}&order=id.asc`);
  },

async criarIngredientes(receitaId, itens) {
  const dados = itens.map(x => ({ receita_id: receitaId, nome: x.nome, qtde: x.qtde || null }));
  return sFetch(`${SUPABASE_URL}/rest/v1/ingrediente`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=representation' }, // <- aqui
    body: JSON.stringify(dados)
  });
}

  async deletarIngrediente(id) {
    return sFetch(`${SUPABASE_URL}/rest/v1/ingrediente?id=eq.${id}`, {
      method: 'DELETE'
    });
  },

  // Cria receita + ingredientes juntos
  async criarReceitaCompleta(receita, ingredientes) {
    try {
      // Criar a receita e garantir retorno com ID
      const novaReceita = await api.criarReceita(receita);

      if (!novaReceita || !novaReceita[0] || !novaReceita[0].id) {
        console.error("Resposta inválida do Supabase:", novaReceita);
        throw new Error("Não foi possível criar a receita");
      }

      const receitaId = novaReceita[0].id;

      // Criar ingredientes apenas se houver
      if (ingredientes && ingredientes.length > 0) {
        const dadosIngredientes = ingredientes.map(x => ({
          receita_id: receitaId,
          nome: x.nome,
          qtde: x.qtde || null
        }));

        const ingCriados = await api.criarIngredientes(receitaId, ingredientes);

        if (!ingCriados || ingCriados.length !== dadosIngredientes.length) {
          console.warn("Alguns ingredientes podem não ter sido criados:", ingCriados);
        }
      }

      // Buscar receita completa
      const receitaCompleta = await api.obterReceita(receitaId);
      receitaCompleta.ingredientes = ingredientes && ingredientes.length > 0
        ? await api.listarIngredientes(receitaId)
        : [];

      return receitaCompleta;

    } catch (err) {
      console.error("Erro ao criar receita completa:", err);
      throw err;
    }
  }
};
