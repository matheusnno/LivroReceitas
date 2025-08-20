// ======= CONFIGURAÇÃO DO SUPABASE =======
// Substitua pelos valores do seu projeto:
const SUPABASE_URL = "https://flalhcrfneubfhyzqbxe.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsYWxoY3JmbmV1YmZoeXpxYnhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MjU2NTEsImV4cCI6MjA3MTIwMTY1MX0.LwYrDgtofJaDfvofHcUeZYnUh0SBk_UxXh2HQgiCwFI";

// cria cliente supabase corretamente (usando Supabase global do UMD)
const supabase = window.Supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// função auxiliar de fetch de dados
async function sFetch(query) {
  const { data, error } = await query;
  if (error) {
    console.error(error);
    throw error;
  }
  return data;
}

// ================== CRUD RECEITAS ==================

// criar receita
async function criarReceita(nome, preparo) {
  const { data, error } = await supabase
    .from("receitas")
    .insert([{ nome, preparo }])
    .select()
    .single();

  if (error) {
    console.error(error);
    throw error;
  }
  return data;
}

// atualizar receita
async function atualizarReceita(id, nome, preparo) {
  const { data, error } = await supabase
    .from("receitas")
    .update({ nome, preparo })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(error);
    throw error;
  }
  return data;
}

// deletar receita
async function deletarReceita(id) {
  const { error } = await supabase.from("receitas").delete().eq("id", id);
  if (error) {
    console.error(error);
    throw error;
  }
}

// ================== CRUD INGREDIENTES ==================

// adicionar ingrediente
async function adicionarIngrediente(receitaId, nome, quantidade) {
  const { data, error } = await supabase
    .from("ingredientes")
    .insert([{ receita_id: receitaId, nome, quantidade }])
    .select()
    .single();

  if (error) {
    console.error(error);
    throw error;
  }
  return data;
}

// atualizar ingrediente
async function atualizarIngrediente(id, nome, quantidade) {
  const { data, error } = await supabase
    .from("ingredientes")
    .update({ nome, quantidade })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(error);
    throw error;
  }
  return data;
}

// deletar ingrediente
async function deletarIngrediente(id) {
  const { error } = await supabase.from("ingredientes").delete().eq("id", id);
  if (error) {
    console.error(error);
    throw error;
  }
}

// ================== API GLOBAL ==================

window.api = {
  listarReceitas: async (termo) => {
    let query = supabase
      .from("receitas")
      .select("*, ingredientes(*)")
      .order("id", { ascending: false });

    if (termo) {
      query = query.ilike("nome", `%${termo}%`);
    }
    return await sFetch(query);
  },
  criarReceita,
  atualizarReceita,
  deletarReceita,
  adicionarIngrediente,
  atualizarIngrediente,
  deletarIngrediente,
};
