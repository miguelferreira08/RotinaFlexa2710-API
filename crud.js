import { API } from "./firebase.js";

const nome = document.getElementById("nomeProduto");
const preco = document.getElementById("precoProduto");
const qtd = document.getElementById("qtdProduto");
const botao = document.getElementById("btnAdicionarProduto");
const lista = document.getElementById("listaProdutos");
const formulario = document.getElementById("formCard");

let formularioAberto = false;
let idEditando = null;

fecharFormulario();

formulario.addEventListener("submit", e => e.preventDefault());

async function requisicao(caminho = "", metodo = "GET", dados = null) {
    const resposta = await fetch(`${API}${caminho}.json`, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: dados ? JSON.stringify(dados) : undefined
    });

    if (!resposta.ok) {
        throw new Error("Erro na API: " + resposta.status);
    }

    return resposta.json();
}

function abrirFormulario() {
    nome.style.display = "block";
    preco.style.display = "block";
    qtd.style.display = "block";

    formularioAberto = true;
    botao.textContent = idEditando === null
        ? "Salvar produto"
        : "Salvar edição";
}

function fecharFormulario() {
    nome.style.display = "none";
    preco.style.display = "none";
    qtd.style.display = "none";

    nome.value = "";
    preco.value = "";
    qtd.value = "";

    formularioAberto = false;
    idEditando = null;
    botao.textContent = "Adicionar produto";
}

botao.addEventListener("click", async function() {
    if (!formularioAberto) {
        abrirFormulario();
        return;
    }

    const produto = {
        nome: nome.value.trim(),
        preco: Number(preco.value),
        quantidade: Number(qtd.value)
    };

    if (!produto.nome || preco.value === "" || qtd.value === "" ||
        !Number.isFinite(produto.preco) || produto.preco <= 0 ||
        !Number.isInteger(produto.quantidade) || produto.quantidade <= 0) {
        alert("Preencha os campos corretamente!");
        return;
    }

    botao.disabled = true;

    try {
        if (idEditando === null) {
            await requisicao("", "POST", produto);
        } else {
            await requisicao("/" + idEditando, "PATCH", produto);
        }

        fecharFormulario();
        await listarProdutos();
    } catch (erro) {
        alert("Erro ao salvar produto!");
        console.error(erro);
    } finally {
        botao.disabled = false;
    }
});

async function listarProdutos() {
    try {
        const produtos = await requisicao();
        lista.innerHTML = "";

        Object.entries(produtos || {}).forEach(([id, produto]) => {
            const linha = lista.insertRow();

            linha.insertCell().textContent = produto.nome;

            linha.insertCell().textContent =
                produto.preco.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL"
                });

            linha.insertCell().textContent = produto.quantidade;

            linha.insertCell().textContent =
                (produto.preco * produto.quantidade)
                .toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL"
                });

            const celulaAcoes = linha.insertCell();
            const acoes = document.createElement("div");
            acoes.className = "acoes";

            const editar = document.createElement("button");
            editar.type = "button";
            editar.textContent = "Editar";
            editar.className = "btn-editar";

            editar.onclick = function() {
                idEditando = id;
                nome.value = produto.nome;
                preco.value = produto.preco;
                qtd.value = produto.quantidade;
                abrirFormulario();
            };

            const excluir = document.createElement("button");
            excluir.type = "button";
            excluir.textContent = "Excluir";
            excluir.className = "btn-excluir";

            excluir.onclick = async function() {
                if (confirm("Deseja excluir este produto?")) {
                    try {
                        await requisicao("/" + id, "DELETE");
                        fecharFormulario();
                        await listarProdutos();
                    } catch (erro) {
                        alert("Erro ao excluir produto!");
                        console.error(erro);
                    }
                }
            };

            acoes.append(editar, excluir);
            celulaAcoes.appendChild(acoes);
        });
    } catch (erro) {
        console.error(erro);
        alert("Erro ao carregar produtos!");
    }
}

listarProdutos();