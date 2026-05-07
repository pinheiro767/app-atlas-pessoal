import os
import json
import uuid
from datetime import datetime

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from gtts import gTTS


BASE_DIR = os.path.dirname(os.path.abspath(__file__))

UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
MAPAS_DIR = os.path.join(BASE_DIR, "mapas")
AUDIOS_DIR = os.path.join(BASE_DIR, "audios")
DATA_FILE = os.path.join(BASE_DIR, "dados_estudo.json")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(MAPAS_DIR, exist_ok=True)
os.makedirs(AUDIOS_DIR, exist_ok=True)

app = Flask(__name__)
CORS(app)

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}


ESTRUTURAS = {
    "plexo_braquial": {
        "titulo": "Plexo Braquial",
        "categoria": "Sistema Nervoso",
        "explicacao": (
            "O plexo braquial deve ser localizado na região cervical lateral e axilar. "
            "Procure primeiro os músculos escalenos anterior e médio. As raízes C5, C6, C7, C8 e T1 "
            "emergem entre esses músculos, formam troncos acima da clavícula, divisões atrás da clavícula "
            "e fascículos ao redor da artéria axilar."
        ),
        "relacoes": [
            "Escaleno anterior",
            "Escaleno médio",
            "Clavícula",
            "Artéria axilar",
            "Veia axilar"
        ],
        "memoria": "Plexo passa no vão dos escalenos e abraça a artéria axilar."
    },

    "linfonodos_axilares": {
        "titulo": "Linfonodos Axilares",
        "categoria": "Sistema Linfático",
        "explicacao": (
            "Os linfonodos axilares são encontrados dentro da gordura da axila, acompanhando vasos. "
            "Para localizá-los, identifique primeiro a veia axilar. Os peitorais ficam na parede anterior, "
            "os subescapulares na parede posterior, os umerais na parede lateral, os centrais no centro "
            "da axila e os apicais no ápice, próximos à clavícula."
        ),
        "relacoes": [
            "Veia axilar",
            "Artéria axilar",
            "Peitoral menor",
            "Subescapular",
            "Úmero",
            "Clavícula"
        ],
        "memoria": "Anterior é peitoral, posterior é subescapular, lateral é umeral, centro é central e ápice é apical."
    },

    "mao_compartimentos": {
        "titulo": "Compartimentos da Mão",
        "categoria": "Regiões Corporais",
        "explicacao": (
            "Na mão, oriente primeiro a palma, o dorso, o lado radial e o lado ulnar. "
            "A região tenar fica na base do polegar, a hipotenar na base do dedo mínimo, "
            "o compartimento central fica no centro da palma e os interósseos ficam entre os metacarpos."
        ),
        "relacoes": [
            "Polegar",
            "Dedo mínimo",
            "Metacarpos",
            "Aponeurose palmar",
            "Retináculo dos flexores"
        ],
        "memoria": "Polegar é radial, mínimo é ulnar."
    }
}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def carregar_dados():
    if not os.path.exists(DATA_FILE):
        return {
            "fotos": [],
            "mapa_mental": {
                "titulo": "Mapa Mental Anatômico",
                "nos": [],
                "conexoes": []
            }
        }

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def salvar_dados(dados):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(dados, f, ensure_ascii=False, indent=4)


@app.route("/")
def home():
    return jsonify({
        "status": "online",
        "app": "Anatomia Topográfica PWA",
        "mensagem": "Backend Flask funcionando corretamente."
    })


@app.route("/estruturas", methods=["GET"])
def listar_estruturas():
    return jsonify(ESTRUTURAS)


@app.route("/estrutura/<chave>", methods=["GET"])
def obter_estrutura(chave):
    estrutura = ESTRUTURAS.get(chave)

    if not estrutura:
        return jsonify({"erro": "Estrutura não encontrada."}), 404

    return jsonify(estrutura)


@app.route("/audio/<chave>", methods=["GET"])
def gerar_audio(chave):
    caminho_audio_direto = os.path.join(AUDIOS_DIR, chave)

    if os.path.exists(caminho_audio_direto):
        return send_from_directory(AUDIOS_DIR, chave)

    estrutura = ESTRUTURAS.get(chave)

    if not estrutura:
        return jsonify({"erro": "Estrutura não encontrada."}), 404

    texto = (
        f"{estrutura['titulo']}. "
        f"{estrutura['explicacao']} "
        f"Método de memorização: {estrutura['memoria']}"
    )

    nome_audio = f"{chave}.mp3"
    caminho_audio = os.path.join(AUDIOS_DIR, nome_audio)

    if not os.path.exists(caminho_audio):
        tts = gTTS(text=texto, lang="pt-br")
        tts.save(caminho_audio)

    return send_from_directory(AUDIOS_DIR, nome_audio)


@app.route("/audio-texto", methods=["POST"])
def gerar_audio_texto():
    data = request.get_json()

    if not data:
        return jsonify({"erro": "Nenhum dado recebido."}), 400

    texto = data.get("texto", "").strip()

    if not texto:
        return jsonify({"erro": "Texto vazio."}), 400

    limite = 4000
    partes = []

    for i in range(0, len(texto), limite):
        partes.append(texto[i:i + limite])

    arquivos = []

    for index, parte in enumerate(partes):
        nome_audio = f"texto_{uuid.uuid4().hex}_{index}.mp3"
        caminho_audio = os.path.join(AUDIOS_DIR, nome_audio)

        tts = gTTS(text=parte, lang="pt-br")
        tts.save(caminho_audio)

        arquivos.append(nome_audio)

    return jsonify({
        "mensagem": "Áudio gerado com sucesso.",
        "partes": arquivos
    })


@app.route("/upload-foto", methods=["POST"])
def upload_foto():

    if "foto" not in request.files:
        return jsonify({
            "erro": "Nenhuma foto enviada."
        }), 400

    foto = request.files["foto"]

    estrutura = request.form.get(
        "estrutura",
        "Estrutura Anatômica"
    )

    observacao = request.form.get(
        "observacao",
        ""
    )

    conexoes = request.form.get(
        "conexoes",
        ""
    )

    if foto.filename == "":
        return jsonify({
            "erro": "Nome do arquivo vazio."
        }), 400

    if not allowed_file(foto.filename):
        return jsonify({
            "erro": "Formato não permitido."
        }), 400

    filename = secure_filename(foto.filename)

    extensao = filename.rsplit(".", 1)[1].lower()

    novo_nome = f"{uuid.uuid4().hex}.{extensao}"

    caminho = os.path.join(
        UPLOAD_DIR,
        novo_nome
    )

    foto.save(caminho)

    dados = carregar_dados()

    registro = {
        "id": uuid.uuid4().hex,
        "arquivo": novo_nome,
        "estrutura": estrutura,
        "observacao": observacao,
        "data": datetime.now().strftime(
            "%Y-%m-%d %H:%M:%S"
        )
    }

    dados["fotos"].append(registro)

    mapa = dados["mapa_mental"]

    # ADICIONA NÓ PRINCIPAL

    if estrutura not in mapa["nos"]:
        mapa["nos"].append(estrutura)

    # OBSERVAÇÃO

    if observacao:

        if observacao not in mapa["nos"]:
            mapa["nos"].append(observacao)

        mapa["conexoes"].append({
            "de": estrutura,
            "para": observacao
        })

    # CONEXÕES AUTOMÁTICAS

    if conexoes:

        lista_conexoes = [
            item.strip()
            for item in conexoes.split(",")
            if item.strip()
        ]

        for conexao in lista_conexoes:

            if conexao not in mapa["nos"]:
                mapa["nos"].append(conexao)

            mapa["conexoes"].append({
                "de": estrutura,
                "para": conexao
            })

    # CONEXÕES PADRÃO AUTOMÁTICAS

    conexoes_automaticas = {
        "Plexo Braquial": [
            "Artéria Axilar",
            "Escaleno Anterior",
            "Escaleno Médio",
            "Clavícula"
        ],

        "Linfonodos Axilares": [
            "Veia Axilar",
            "Peitoral Menor",
            "Subescapular",
            "Úmero"
        ],

        "Compartimentos da Mão": [
            "Polegar",
            "Metacarpos",
            "Aponeurose Palmar",
            "Retináculo dos Flexores"
        ]
    }

    if estrutura in conexoes_automaticas:

        for conexao in conexoes_automaticas[estrutura]:

            if conexao not in mapa["nos"]:
                mapa["nos"].append(conexao)

            mapa["conexoes"].append({
                "de": estrutura,
                "para": conexao
            })

    salvar_dados(dados)

    return jsonify({
        "mensagem": "Foto enviada e mapa mental atualizado.",
        "registro": registro,
        "mapa_mental": mapa
    })
    if "foto" not in request.files:
        return jsonify({"erro": "Nenhuma foto enviada."}), 400

    foto = request.files["foto"]
    estrutura = request.form.get("estrutura", "estrutura_nao_informada")
    observacao = request.form.get("observacao", "")

    if foto.filename == "":
        return jsonify({"erro": "Nome de arquivo vazio."}), 400

    if not allowed_file(foto.filename):
        return jsonify({"erro": "Formato de imagem não permitido."}), 400

    filename = secure_filename(foto.filename)
    extensao = filename.rsplit(".", 1)[1].lower()
    novo_nome = f"{uuid.uuid4().hex}.{extensao}"
    caminho = os.path.join(UPLOAD_DIR, novo_nome)

    foto.save(caminho)

    dados = carregar_dados()

    registro = {
        "id": uuid.uuid4().hex,
        "arquivo": novo_nome,
        "estrutura": estrutura,
        "observacao": observacao,
        "data": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

    dados["fotos"].append(registro)

    mapa = dados["mapa_mental"]

    if estrutura not in mapa["nos"]:
        mapa["nos"].append(estrutura)

    if observacao and observacao not in mapa["nos"]:
        mapa["nos"].append(observacao)
        mapa["conexoes"].append({
            "de": estrutura,
            "para": observacao
        })

    salvar_dados(dados)

    return jsonify({
        "mensagem": "Foto enviada e adicionada ao mapa mental.",
        "registro": registro
    })


@app.route("/uploads/<filename>", methods=["GET"])
def servir_upload(filename):
    return send_from_directory(UPLOAD_DIR, filename)


@app.route("/fotos", methods=["GET"])
def listar_fotos():
    dados = carregar_dados()
    return jsonify(dados["fotos"])


@app.route("/mapa-mental", methods=["GET"])
def obter_mapa_mental():
    dados = carregar_dados()
    return jsonify(dados["mapa_mental"])


@app.route("/mapa-mental/adicionar", methods=["POST"])
def adicionar_mapa_mental():
    data = request.get_json()

    if not data:
        return jsonify({"erro": "Nenhum dado recebido."}), 400

    origem = data.get("origem")
    destino = data.get("destino")

    if not origem or not destino:
        return jsonify({"erro": "Informe origem e destino."}), 400

    dados = carregar_dados()
    mapa = dados["mapa_mental"]

    if origem not in mapa["nos"]:
        mapa["nos"].append(origem)

    if destino not in mapa["nos"]:
        mapa["nos"].append(destino)

    mapa["conexoes"].append({
        "de": origem,
        "para": destino
    })

    salvar_dados(dados)

    return jsonify({
        "mensagem": "Conexão adicionada ao mapa mental.",
        "mapa_mental": mapa
    })


@app.route("/receber-imagens", methods=["POST"])
def receber_imagens():
    if "imagens" not in request.files:
        return jsonify({"erro": "Nenhuma imagem recebida."}), 400

    arquivos = request.files.getlist("imagens")
    salvos = []

    for arquivo in arquivos:
        if arquivo and allowed_file(arquivo.filename):
            filename = secure_filename(arquivo.filename)
            extensao = filename.rsplit(".", 1)[1].lower()
            novo_nome = f"{uuid.uuid4().hex}.{extensao}"
            caminho = os.path.join(UPLOAD_DIR, novo_nome)
            arquivo.save(caminho)

            salvos.append({
                "arquivo_original": filename,
                "arquivo_salvo": novo_nome
            })

    return jsonify({
        "mensagem": "Imagens recebidas com sucesso.",
        "total": len(salvos),
        "imagens": salvos
    })


@app.route("/limpar-estudo", methods=["DELETE"])
def limpar_estudo():
    dados = {
        "fotos": [],
        "mapa_mental": {
            "titulo": "Mapa Mental Anatômico",
            "nos": [],
            "conexoes": []
        }
    }

    salvar_dados(dados)

    return jsonify({"mensagem": "Dados de estudo apagados."})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)