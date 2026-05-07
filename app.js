const API = window.location.origin;


function abrirAba(id) {

    document
        .querySelectorAll(".aba")
        .forEach(aba => {
            aba.classList.remove("ativa");
        });

    document
        .getElementById(id)
        .classList.add("ativa");

    if (id === "galeria") {
        carregarGaleria();
    }

    if (id === "mapa") {
        carregarMapaMental();
    }
}


async function carregarGaleria() {

    const grade = document.getElementById("grade-imagens");

    grade.innerHTML = "Carregando...";

    try {

        const resposta = await fetch(`${API}/fotos`);

        const fotos = await resposta.json();

        if (!fotos.length) {

            grade.innerHTML = `
                <div class="card-imagem">
                    Nenhuma imagem encontrada.
                </div>
            `;

            return;
        }

        grade.innerHTML = "";

        fotos.reverse().forEach(foto => {

            const card = document.createElement("div");

            card.className = "card-imagem";

            card.innerHTML = `
                <img src="${API}/uploads/${foto.arquivo}">
                <h3>${foto.estrutura}</h3>
                <p>${foto.observacao || ""}</p>
            `;

            grade.appendChild(card);

        });

    } catch (erro) {

        console.error(erro);

        grade.innerHTML = `
            <div class="card-imagem">
                Erro ao carregar imagens.
            </div>
        `;
    }
}


async function carregarMapaMental() {

    const area = document.getElementById("mapa-mental");

    area.innerHTML = "Carregando mapa mental...";

    try {

        const resposta = await fetch(`${API}/mapa-mental`);

        const mapa = await resposta.json();

        if (!mapa.nos.length) {

            area.innerHTML = `
                <div class="no-mapa">
                    Nenhuma estrutura ainda.
                </div>
            `;

            return;
        }

        area.innerHTML = "";

        mapa.nos.forEach(no => {

            const div = document.createElement("div");

            div.className = "no-mapa";

            div.innerHTML = `
                <strong>${no}</strong>
            `;

            area.appendChild(div);

        });

    } catch (erro) {

        console.error(erro);

        area.innerHTML = `
            <div class="no-mapa">
                Erro ao carregar mapa mental.
            </div>
        `;
    }
}


async function abrirCamera() {

    const video = document.getElementById("video");

    try {

        const stream = await navigator.mediaDevices.getUserMedia({
            video: true
        });

        video.srcObject = stream;

    } catch (erro) {

        alert("Erro ao abrir câmera.");

        console.error(erro);
    }
}


function tirarFoto() {

    const video = document.getElementById("video");
    const canvas = document.getElementById("canvas");

    if (!video.srcObject) {
        alert("Abra a câmera primeiro.");
        return;
    }

    const estrutura = prompt(
        "Qual estrutura anatômica?"
    );

    if (!estrutura) return;

    const conexoes = prompt(
        "Estruturas relacionadas separadas por vírgula"
    );

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");

    ctx.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
    );

    canvas.toBlob(async blob => {

        const formData = new FormData();

        formData.append(
            "foto",
            blob,
            `foto_${Date.now()}.png`
        );

        formData.append(
            "estrutura",
            estrutura
        );

        formData.append(
            "conexoes",
            conexoes || ""
        );

        formData.append(
            "observacao",
            "Imagem anatômica"
        );

        try {

            await fetch(`${API}/upload-foto`, {
                method: "POST",
                body: formData
            });

            alert("Foto enviada.");

            carregarGaleria();

            carregarMapaMental();

        } catch (erro) {

            console.error(erro);

            alert("Erro ao enviar foto.");
        }

    }, "image/png");
}


async function enviarImagens() {

    const input = document.getElementById("input-imagens");

    const resultado = document.getElementById("resultado-upload");

    if (!input.files.length) {

        resultado.innerHTML = `
            <div class="erro-upload">
                Selecione imagens.
            </div>
        `;

        return;
    }

    const formData = new FormData();

    for (let i = 0; i < input.files.length; i++) {

        formData.append(
            "imagens",
            input.files[i]
        );
    }

    resultado.innerHTML = `
        <div class="carregando-upload">
            Enviando imagens...
        </div>
    `;

    try {

        const resposta = await fetch(`${API}/receber-imagens`, {
            method: "POST",
            body: formData
        });

        const dados = await resposta.json();

        console.log(dados);

        resultado.innerHTML = `
            <div class="sucesso-upload">
                ${dados.total} imagens enviadas com sucesso.
            </div>
        `;

        carregarGaleria();

        carregarMapaMental();

    } catch (erro) {

        console.error(erro);

        resultado.innerHTML = `
            <div class="erro-upload">
                Erro ao enviar imagens.
            </div>
        `;
    }
}


function tocarAudio(chave) {

    const player = document.getElementById("player");

    player.src = `${API}/audio/${chave}`;

    player.play();
}


async function gerarAudioTexto() {

    const texto = document
        .getElementById("texto-audio")
        .value
        .trim();

    if (!texto) {
        alert("Digite um texto.");
        return;
    }

    try {

        const resposta = await fetch(`${API}/audio-texto`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                texto
            })
        });

        const dados = await resposta.json();

        const lista = document.getElementById("lista-audios-texto");

        lista.innerHTML = "";

        dados.partes.forEach(parte => {

            const audio = document.createElement("audio");

            audio.controls = true;

            audio.src = `${API}/audio/${parte}`;

            lista.appendChild(audio);

        });

    } catch (erro) {

        console.error(erro);

        alert("Erro ao gerar áudio.");
    }
}


window.onload = () => {

    carregarGaleria();

    carregarMapaMental();
};
