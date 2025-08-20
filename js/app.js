// ======= CONFIGURAÇÃO DO SUPABASE =======
// Substitua pelos valores do seu projeto:
const SUPABASE_URL = "https://flalhcrfneubfhyzqbxe.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsYWxoY3JmbmV1YmZoeXpxYnhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MjU2NTEsImV4cCI6MjA3MTIwMTY1MX0.LwYrDgtofJaDfvofHcUeZYnUh0SBk_UxXh2HQgiCwFI";

// Config Supabase - já deve estar definidas SUPABASE_URL e SUPABASE_KEY
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function carregar() {
    const { data, error } = await supabaseClient.from("receitas").select("id, nome, ingredientes(id, nome, quantidade)");
    if (error) {
        console.error("Erro ao carregar receitas:", error);
        return;
    }

    const lista = document.getElementById("lista");
    lista.innerHTML = "";
    data.forEach((receita) => {
        const li = document.createElement("li");
        li.innerHTML = `
            <strong>${receita.nome}</strong>
            <button onclick="editarReceita(${receita.id}, '${receita.nome}')">✏️</button>
            <button onclick="deletarReceita(${receita.id})">🗑️</button>
            <ul>
                ${receita.ingredientes.map(ing => `
                    <li>
                        ${ing.nome} - ${ing.quantidade}
                        <button onclick="editarIngrediente(${ing.id}, '${ing.nome}', '${ing.quantidade}')">✏️</button>
                        <button onclick="deletarIngrediente(${ing.id})">🗑️</button>
                    </li>
                `).join("")}
            </ul>
            <button onclick="adicionarIngrediente(${receita.id})">+ Ingrediente</button>
        `;
        lista.appendChild(li);
    });
}

async function adicionarReceita() {
    const nome = document.getElementById("nome").value;
    if (!nome) return;

    const { error } = await supabaseClient.from("receitas").insert([{ nome }]);
    if (error) console.error("Erro ao adicionar receita:", error);
    document.getElementById("nome").value = "";
    carregar();
}

async function deletarReceita(id) {
    await supabaseClient.from("ingredientes").delete().eq("receita_id", id);
    await supabaseClient.from("receitas").delete().eq("id", id);
    carregar();
}

async function adicionarIngrediente(receitaId) {
    const nome = prompt("Nome do ingrediente:");
    const quantidade = prompt("Quantidade:");
    if (!nome || !quantidade) return;

    await supabaseClient.from("ingredientes").insert([{ nome, quantidade, receita_id: receitaId }]);
    carregar();
}

async function deletarIngrediente(id) {
    await supabaseClient.from("ingredientes").delete().eq("id", id);
    carregar();
}

// -------- NOVAS FUNÇÕES --------
async function editarReceita(id, nomeAtual) {
    const novoNome = prompt("Novo nome da receita:", nomeAtual);
    if (!novoNome) return;

    const { error } = await supabaseClient.from("receitas").update({ nome: novoNome }).eq("id", id);
    if (error) console.error("Erro ao editar receita:", error);
    carregar();
}

async function editarIngrediente(id, nomeAtual, quantidadeAtual) {
    const novoNome = prompt("Novo nome do ingrediente:", nomeAtual);
    const novaQuantidade = prompt("Nova quantidade:", quantidadeAtual);
    if (!novoNome || !novaQuantidade) return;

    const { error } = await supabaseClient.from("ingredientes").update({ nome: novoNome, quantidade: novaQuantidade }).eq("id", id);
    if (error) console.error("Erro ao editar ingrediente:", error);
    carregar();
}

// Inicializar
carregar();
