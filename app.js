const API = window.location.origin;
const TOTAL_IMAGENS = 120;

let slideAtual = 1;
let modoSlidesAtivo = false;

// =====================
// ABAS
// =====================

function abrirAba(id) {
    document.querySelectorAll(".aba").forEach(aba => {
        aba.classList.remove("ativa");
    });

    document.getElementById(id).classList.add("ativa");

    if (id === "galeria") carregarGaleria();
    if (id === "mapa") carregarMapaMental();
}

// =====================
// GALERIA 1.png até 120.png
// =====================

async function carregarGaleria() {
    const grade = document.getElementById("grade-imagens");
    grade.innerHTML = "";

    for (let i = 1; i <= TOTAL_IMAGENS; i++) {
        const card = document.createElement("div");
        card.className = "card-imagem";

        card.innerHTML = `
            <img 
                src="${API}/assets/img/${i}.png"
                alt="Imagem ${i}"
                onclick="abrirSlide(${i})"
                onerror="this.parentElement.style.display='none'"
            >
            <h3>Imagem ${i}</h3>
            <button onclick="gerarMapaDaImagem(${i})">🧠 Gerar mapa</button>
            <button onclick="lerImagem(${i})">🔊 Áudio</button>
        `;

        grade.appendChild(card);
    }

    try {
        const resposta = await fetch(`${API}/fotos`);
        const fotos = await resposta.json();

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
        console.error("Erro ao carregar uploads:", erro);
    }
}

// =====================
// SLIDES EM TELA CHEIA
// =====================

function abrirSlide(numero) {
    slideAtual = numero;

    let visor = document.getElementById("visor-slides");

    if (!visor) {
        visor = document.createElement("div");
        visor.id = "visor-slides";
        visor.className = "visor-slides";

        visor.innerHTML = `
            <button class="fechar-slide" onclick="fecharSlide()">✕</button>
            <button class="nav-slide esquerda" onclick="slideAnterior()">‹</button>
            <img id="imagem-slide">
            <button class="nav-slide direita" onclick="proximoSlide()">›</button>

            <div class="barra-slide">
                <span id="contador-slide"></span>
                <button onclick="gerarMapaDaImagem(slideAtual)">🧠 Gerar mapa</button>
                <button onclick="lerImagem(slideAtual)">🔊 Áudio</button>
            </div>
        `;

        document.body.appendChild(visor);
    }

    atualizarSlide();
    visor.style.display = "flex";
    modoSlidesAtivo = true;

    if (visor.requestFullscreen) {
        visor.requestFullscreen().catch(() => {});
    }
}

function atualizarSlide() {
    document.getElementById("imagem-slide").src = `${API}/assets/img/${slideAtual}.png`;
    document.getElementById("contador-slide").innerText = `Imagem ${slideAtual} / ${TOTAL_IMAGENS}`;
}

function proximoSlide() {
    slideAtual++;
    if (slideAtual > TOTAL_IMAGENS) slideAtual = 1;
    atualizarSlide();
}

function slideAnterior() {
    slideAtual--;
    if (slideAtual < 1) slideAtual = TOTAL_IMAGENS;
    atualizarSlide();
}

function fecharSlide() {
    const visor = document.getElementById("visor-slides");
    if (visor) visor.style.display = "none";

    modoSlidesAtivo = false;

    if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
    }
}

document.addEventListener("keydown", event => {
    if (!modoSlidesAtivo) return;

    if (event.key === "ArrowRight") proximoSlide();
    if (event.key === "ArrowLeft") slideAnterior();
    if (event.key === "Escape") fecharSlide();
});

// =====================
// MAPA MENTAL
// =====================

async function gerarMapaDaImagem(numero) {
    const estrutura = prompt(
        `Qual estrutura principal aparece na imagem ${numero}?`
    );

    if (!estrutura) return;

    const conexoes = prompt(
        "Digite estruturas relacionadas separadas por vírgula.\nEx: Artéria axilar, Veia axilar, Plexo braquial"
    );

    await fetch(`${API}/mapa-mental/adicionar`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            origem: `Imagem ${numero}: ${estrutura}`,
            destino: conexoes || "Estrutura anatômica"
        })
    });

    if (conexoes) {
        const lista = conexoes.split(",");

        for (const item of lista) {
            const destino = item.trim();

            if (destino) {
                await fetch(`${API}/mapa-mental/adicionar`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        origem: `Imagem ${numero}: ${estrutura}`,
                        destino: destino
                    })
                });
            }
        }
    }

    alert("Mapa mental atualizado.");
    carregarMapaMental();
}

async function carregarMapaMental() {
    const area = document.getElementById("mapa-mental");

    if (!area) return;

    area.innerHTML = "Carregando mapa mental...";

    try {
        const resposta = await fetch(`${API}/mapa-mental`);
        const mapa = await resposta.json();

        if (!mapa.nos || mapa.nos.length === 0) {
            area.innerHTML = `
                <div class="no-mapa">
                    Nenhuma estrutura ainda. Clique em “Gerar mapa” nas imagens.
                </div>
            `;
            return;
        }

        area.innerHTML = "";

        mapa.nos.forEach(no => {
            const div = document.createElement("div");
            div.className = "no-mapa";
            div.innerHTML = `<strong>${no}</strong>`;
            area.appendChild(div);
        });

    } catch (erro) {
        console.error(erro);
        area.innerHTML = `<div class="no-mapa">Erro ao carregar mapa mental.</div>`;
    }
}

// =====================
// ÁUDIO
// =====================

async function lerImagem(numero) {
    const texto = prompt(
        `Digite o texto que deseja ouvir para a imagem ${numero}:`
    );

    if (!texto) return;

    gerarAudioTextoDireto(`Imagem ${numero}. ${texto}`);
}

function tocarAudio(chave) {
    const player = document.getElementById("player");
    player.src = `${API}/audio/${chave}`;
    player.play();
}

async function gerarAudioTexto() {
    const texto = document.getElementById("texto-audio").value.trim();

    if (!texto) {
        alert("Digite ou cole um texto.");
        return;
    }

    gerarAudioTextoDireto(texto);
}

async function gerarAudioTextoDireto(texto) {
    const lista = document.getElementById("lista-audios-texto");

    if (lista) {
        lista.innerHTML = "Gerando áudio...";
    }

    try {
        const resposta = await fetch(`${API}/audio-texto`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ texto })
        });

        const dados = await resposta.json();

        if (lista) {
            lista.innerHTML = "";
        }

        dados.partes.forEach(parte => {
            const audio = document.createElement("audio");
            audio.controls = true;
            audio.src = `${API}/audio/${parte}`;

            if (lista) {
                lista.appendChild(audio);
            } else {
                audio.play();
            }
        });

    } catch (erro) {
        console.error(erro);
        alert("Erro ao gerar áudio.");
    }
}

// =====================
// CÂMERA
// =====================

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

    const estrutura = prompt("Qual estrutura anatômica?");
    if (!estrutura) return;

    const conexoes = prompt("Estruturas relacionadas separadas por vírgula:");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async blob => {
        const formData = new FormData();

        formData.append("foto", blob, `foto_${Date.now()}.png`);
        formData.append("estrutura", estrutura);
        formData.append("conexoes", conexoes || "");
        formData.append("observacao", "Imagem anatômica capturada");

        await fetch(`${API}/upload-foto`, {
            method: "POST",
            body: formData
        });

        alert("Foto enviada e mapa mental atualizado.");
        carregarGaleria();
        carregarMapaMental();

    }, "image/png");
}

// =====================
// UPLOAD
// =====================

async function enviarImagens() {
    const input = document.getElementById("input-imagens");
    const resultado = document.getElementById("resultado-upload");

    if (!input.files.length) {
        resultado.innerHTML = "Selecione imagens.";
        return;
    }

    const formData = new FormData();

    for (const arquivo of input.files) {
        formData.append("imagens", arquivo);
    }

    resultado.innerHTML = "Enviando imagens...";

    try {
        const resposta = await fetch(`${API}/receber-imagens`, {
            method: "POST",
            body: formData
        });

        const dados = await resposta.json();

        resultado.innerHTML = `${dados.total} imagens enviadas com sucesso.`;

        carregarGaleria();
        carregarMapaMental();

    } catch (erro) {
        console.error(erro);
        resultado.innerHTML = "Erro ao enviar imagens.";
    }
}

// =====================
// INICIAR
// =====================

window.onload = () => {
    carregarGaleria();
    carregarMapaMental();
};
let slideAtual = 1;
const TOTAL_IMAGENS = 120;

function atualizarSlideNormal() {
    const img = document.getElementById("slide-img");
    const titulo = document.getElementById("slide-titulo");

    if (!img || !titulo) return;

    img.src = `${API}/assets/img/${slideAtual}.png`;
    titulo.innerText = `Imagem ${slideAtual} / ${TOTAL_IMAGENS}`;
}

function proximoSlide() {
    slideAtual++;

    if (slideAtual > TOTAL_IMAGENS) {
        slideAtual = 1;
    }

    atualizarSlideNormal();

    if (document.getElementById("imagem-slide")) {
        atualizarSlide();
    }
}

function slideAnterior() {
    slideAtual--;

    if (slideAtual < 1) {
        slideAtual = TOTAL_IMAGENS;
    }

    atualizarSlideNormal();

    if (document.getElementById("imagem-slide")) {
        atualizarSlide();
    }
}
