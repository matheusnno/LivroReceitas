// ======= CONFIGURAÇÃO DO SUPABASE =======
// Substitua pelos valores do seu projeto:
const SUPABASE_URL = "https://flalhcrfneubfhyzqbxe.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsYWxoY3JmbmV1YmZoeXpxYnhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MjU2NTEsImV4cCI6MjA3MTIwMTY1MX0.LwYrDgtofJaDfvofHcUeZYnUh0SBk_UxXh2HQgiCwFI";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ------------------ Funções utilitárias ------------------

async function sFetch(query) {
  const { data, error } = await query;
  if (error) {
    console.error("Erro REST", error);
    alert("Ocorreu um erro: " + error.message);
    throw error;
  }
  return data;
}

function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// ------------------ CRUD Receitas ------------------

async function carregarReceitas() {
  const receitas = await sFetch(
    supabase.from("receitas").select("*").order("id", { ascending: false })
  );
  const lista = document.getElementById("lista-receitas");
  if (!lista) return;

  lista.innerHTML = "";
  receitas.forEach((r) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <a href="receita.html?id=${r.id}">${r.nome}</a>
      <button onclick="deletarReceita(${r.id})">Excluir</button>
    `;
    lista.appendChild(li);
  });
}

async function criarReceita(nome, descricao) {
  const [nova] = await sFetch(
    supabase.from("receitas").insert([{ nome, descricao }]).select()
  );
  return nova;
}

async function atualizarReceita(id, nome, descricao) {
  const [atualizada] = await sFetch(
    supabase.from("receitas").update({ nome, descricao }).eq("id", id).select()
  );
  return atualizada;
}

async function deletarReceita(id) {
  if (!confirm("Tem certeza que deseja excluir esta receita?")) return;
  await sFetch(supabase.from("receitas").delete().eq("id", id));
  carregarReceitas();
}

// ------------------ CRUD Ingredientes ------------------

async function carregarIngredientes(idReceita) {
  const ingredientes = await sFetch(
    supabase.from("ingredientes").select("*").eq("receita_id", idReceita)
  );
  const lista = document.getElementById("lista-ingredientes");
  if (!lista) return;

  lista.innerHTML = "";
  ingredientes.forEach((i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <input type="text" value="${i.nome}" onchange="atualizarIngrediente(${i.id}, this.value, null)" />
      <input type="text" value="${i.quantidade}" onchange="atualizarIngrediente(${i.id}, null, this.value)" />
      <button onclick="deletarIngrediente(${i.id}, ${idReceita})">Excluir</button>
    `;
    lista.appendChild(li);
  });
}

async function criarIngrediente(idReceita, nome, quantidade) {
  await sFetch(
    supabase
      .from("ingredientes")
      .insert([{ receita_id: idReceita, nome, quantidade }])
  );
}

async function atualizarIngrediente(id, nome = null, quantidade = null) {
  const updateObj = {};
  if (nome !== null) updateObj.nome = nome;
  if (quantidade !== null) updateObj.quantidade = quantidade;

  await sFetch(
    supabase.from("ingredientes").update(updateObj).eq("id", id)
  );
}

async function deletarIngrediente(id, idReceita) {
  await sFetch(supabase.from("ingredientes").delete().eq("id", id));
  carregarIngredientes(idReceita);
}

// ------------------ Página nova.html ------------------

async function inicializarNovaReceita() {
  const id = getQueryParam("id");
  const form = document.getElementById("form-receita");

  if (id) {
    // Modo edição
    const [receita] = await sFetch(
      supabase.from("receitas").select("*").eq("id", id)
    );
    form.nome.value = receita.nome;
    form.descricao.value = receita.descricao;
    document.getElementById("btn-salvar").innerText = "Salvar Alterações";
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nome = form.nome.value.trim();
    const descricao = form.descricao.value.trim();

    if (!nome) {
      alert("Informe um nome para a receita.");
      return;
    }

    let receita;
    if (id) {
      receita = await atualizarReceita(id, nome, descricao);
    } else {
      receita = await criarReceita(nome, descricao);
    }

    // Ingredientes temporários no form
    const ingredientesInputs = document.querySelectorAll(".ingrediente-item");
    for (const item of ingredientesInputs) {
      const nomeIng = item.querySelector(".nome").value.trim();
      const qtdIng = item.querySelector(".quantidade").value.trim();
      if (nomeIng) {
        await criarIngrediente(receita.id, nomeIng, qtdIng);
      }
    }

    window.location.href = "receita.html?id=" + receita.id;
  });
}

// ------------------ Página receita.html ------------------

async function inicializarReceita() {
  const id = getQueryParam("id");
  if (!id) return;

  const [receita] = await sFetch(
    supabase.from("receitas").select("*").eq("id", id)
  );
  document.getElementById("titulo-receita").innerText = receita.nome;
  document.getElementById("descricao-receita").innerText = receita.descricao;

  carregarIngredientes(id);

  document.getElementById("btn-add-ingrediente").addEventListener("click", async () => {
    const nome = prompt("Nome do ingrediente:");
    const quantidade = prompt("Quantidade:");
    if (nome) {
      await criarIngrediente(id, nome, quantidade);
      carregarIngredientes(id);
    }
  });

  document.getElementById("btn-editar-receita").addEventListener("click", () => {
    window.location.href = "nova.html?id=" + id;
  });
}

// ------------------ Inicialização ------------------

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("lista-receitas")) carregarReceitas();
  if (document.getElementById("form-receita")) inicializarNovaReceita();
  if (document.getElementById("titulo-receita")) inicializarReceita();
});
