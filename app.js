const API = "http://localhost:5000";

function abrirAba(id) {
    document.querySelectorAll(".aba").forEach(aba => aba.classList.remove("ativa"));
    document.getElementById(id).classList.add("ativa");

    if (id === "mapa") carregarMapaMental();
}

function carregarGaleria() {
    const grade = document.getElementById("grade-imagens");
    grade.innerHTML = "";

    for (let i = 1; i <= 60; i++) {
        const card = document.createElement("div");
        card.className = "card-imagem";

        card.innerHTML = `
            <img src="assets/img/${i}.png" alt="Imagem anatômica ${i}">
            <h3>Imagem ${i}</h3>
        `;

        card.onclick = () => abrirImagem(`assets/img/${i}.png`, i);
        grade.appendChild(card);
    }
}

function abrirImagem(src, numero) {
    const janela = window.open("", "_blank");
    janela.document.write(`
        <html>
        <head>
            <title>Imagem ${numero}</title>
            <style>
                body {
                    margin:0;
                    background:#020617;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    height:100vh;
                }
                img {
                    max-width:95%;
                    max-height:95%;
                    border-radius:20px;
                    box-shadow:0 0 35px rgba(56,189,248,.6);
                }
            </style>
        </head>
        <body>
            <img src="${src}">
        </body>
        </html>
    `);
}

async function tocarAudio(chave) {
    const player = document.getElementById("player");
    player.src = `${API}/audio/${chave}`;
    await player.play();
}

async function gerarAudioTexto() {
    const texto = document.getElementById("texto-audio").value;
    const lista = document.getElementById("lista-audios-texto");

    if (!texto.trim()) {
        alert("Cole um texto primeiro.");
        return;
    }

    lista.innerHTML = `<p>Gerando áudio do texto...</p>`;

    try {
        const resposta = await fetch(`${API}/audio-texto`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ texto })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            lista.innerHTML = `<p>Erro: ${dados.erro || "não foi possível gerar o áudio."}</p>`;
            return;
        }

        lista.innerHTML = "";

        dados.partes.forEach((arquivo, index) => {
            const bloco = document.createElement("div");
            bloco.className = "no-mapa";

            bloco.innerHTML = `
                <p><strong>Parte ${index + 1}</strong></p>
                <audio controls src="${API}/audio/${arquivo}"></audio>
            `;

            lista.appendChild(bloco);
        });

    } catch (erro) {
        lista.innerHTML = `<p>Erro ao conectar com o backend.</p>`;
        console.error(erro);
    }
}

let streamCamera = null;

async function abrirCamera() {
    const video = document.getElementById("video");

    try {
        streamCamera = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
            audio: false
        });

        video.srcObject = streamCamera;

    } catch (erro) {
        alert("Não foi possível abrir a câmera.");
        console.error(erro);
    }
}

function tirarFoto() {
    const video = document.getElementById("video");
    const canvas = document.getElementById("canvas");
    const fotos = document.getElementById("fotos-salvas");

    if (!video.srcObject) {
        alert("Abra a câmera primeiro.");
        return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async blob => {
        const nome = `foto_${Date.now()}.png`;

        const formData = new FormData();
        formData.append("foto", blob, nome);
        formData.append("estrutura", "Foto anatômica de estudo");
        formData.append("observacao", "Imagem capturada pela câmera");

        await fetch(`${API}/upload-foto`, {
            method: "POST",
            body: formData
        });

        const img = document.createElement("img");
        img.src = URL.createObjectURL(blob);
        fotos.prepend(img);

        carregarMapaMental();

    }, "image/png");
}

async function carregarMapaMental() {
    const area = document.getElementById("mapa-mental");
    area.innerHTML = "";

    try {
        const resposta = await fetch(`${API}/mapa-mental`);
        const mapa = await resposta.json();

        if (!mapa.nos || mapa.nos.length === 0) {
            area.innerHTML = `<div class="no-mapa">Tire fotos para começar seu mapa mental</div>`;
            return;
        }

        mapa.nos.forEach(no => {
            const div = document.createElement("div");
            div.className = "no-mapa";
            div.textContent = no;
            area.appendChild(div);
        });

    } catch (erro) {
        area.innerHTML = `<div class="no-mapa">Backend não conectado</div>`;
        console.error(erro);
    }
}

async function enviarImagens() {
    const input = document.getElementById("input-imagens");
    const resultado = document.getElementById("resultado-upload");

    if (!input.files.length) {
        alert("Selecione uma ou mais imagens.");
        return;
    }

    const formData = new FormData();

    for (const arquivo of input.files) {
        formData.append("imagens", arquivo);
    }

    try {
        const resposta = await fetch(`${API}/receber-imagens`, {
            method: "POST",
            body: formData
        });

        const dados = await resposta.json();

        resultado.innerHTML = `
            <div class="no-mapa">
                ${dados.total} imagem(ns) recebida(s) com sucesso.
            </div>
        `;

    } catch (erro) {
        resultado.innerHTML = `<div class="no-mapa">Erro ao enviar imagens.</div>`;
        console.error(erro);
    }
}

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js")
        .then(() => console.log("Service Worker registrado"))
        .catch(erro => console.error("Erro no Service Worker", erro));
}

carregarGaleria();
carregarMapaMental();
