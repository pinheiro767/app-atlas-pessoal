async function carregarGaleria() {

    const grade = document.getElementById("grade-imagens");

    grade.innerHTML = "";

    // IMAGENS FIXAS 1.png até 60.png

    for (let i = 1; i <= 60; i++) {

        const card = document.createElement("div");

        card.className = "card-imagem";

        card.innerHTML = `
            <img 
                src="assets/img/${i}.png"
                onerror="this.style.display='none'"
            >

            <h3>Imagem ${i}</h3>
        `;

        grade.appendChild(card);
    }

    // IMAGENS ENVIADAS

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

        console.error(erro);
    }
}
