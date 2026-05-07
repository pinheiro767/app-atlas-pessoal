async function carregarGaleria() {

    const grade = document.getElementById("grade-imagens");

    grade.innerHTML = "";

    // =========================
    // IMAGENS FIXAS 1.png → 60.png
    // =========================

    for (let i = 1; i <= 60; i++) {

        const card = document.createElement("div");

        card.className = "card-imagem";

        card.innerHTML = `
            <img 
                src="${API}/assets/img/${i}.png"
                alt="Imagem ${i}"
                onerror="this.style.display='none'"
            >

            <h3>Imagem ${i}</h3>
        `;

        grade.appendChild(card);
    }

    // =========================
    // IMAGENS ENVIADAS
    // =========================

    try {

        const resposta = await fetch(`${API}/fotos`);

        const fotos = await resposta.json();

        fotos.reverse().forEach(foto => {

            const card = document.createElement("div");

            card.className = "card-imagem";

            card.innerHTML = `
                <img 
                    src="${API}/uploads/${foto.arquivo}"
                    alt="${foto.estrutura}"
                >

                <h3>${foto.estrutura}</h3>

                <p>${foto.observacao || ""}</p>
            `;

            grade.appendChild(card);

        });

    } catch (erro) {

        console.error("Erro ao carregar uploads:", erro);
    }
}
