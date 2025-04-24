let scannerAtivo = false;
let ultimoCodigoDetectado = "";

function iniciarScanner() {
  const readerDiv = document.getElementById("reader");
  const resultadoDiv = document.getElementById("resultado");
  const formAdd = document.getElementById("form-add");

  if (scannerAtivo) return;

  scannerAtivo = true;
  readerDiv.style.display = "block";

  const html5QrCode = new Html5Qrcode("reader");

  html5QrCode.start(
    { facingMode: "environment" },
    { fps: 60, qrbox: 250 },
    (decodedText, decodedResult) => {
      fetch(`/products?product_code=${decodedText}`)
        .then(res => {
          if (!res.ok) throw new Error("Produto não encontrado");
          return res.json();
        })
        .then(produto => {
          resultadoDiv.innerText = `
            ✅ Produto encontrado:
            • Nome: ${product_name}
            • Código: ${product_code}
            • Classe: ${product_class}
          `;
          formAdd.style.display = "none";
        })
        .catch(() => {
          resultadoDiv.innerText = `❌ Produto não encontrado para o código: ${decodedText}`;
          formAdd.style.display = "block";
          ultimoCodigoDetectado = decodedText;
        })
        .finally(() => {
          html5QrCode.stop().then(() => {
            scannerAtivo = false;
            readerDiv.style.display = "none";
          });
        });
    },
    (errorMessage) => {
      // Ignorar erros de leitura
    }
  ).catch(err => {
    resultadoDiv.innerText = `Erro ao acessar a câmera`;
    scannerAtivo = false;
  });
}

function adicionarProduto() {
  const nome = document.getElementById("newName").value.trim();
  const classe = document.getElementById("newClass").value.trim();
  const resultadoDiv = document.getElementById("resultado");

  if (!nome || !classe || !ultimoCodigoDetectado) {
    alert("Preencha todos os campos.");
    return;
  }

  const novoProduto = {
    name: nome,
    class: classe,
    code: ultimoCodigoDetectado
  };

  fetch("/products", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(novoProduto)
  })
    .then(res => {
      if (!res.ok) throw new Error("Erro ao adicionar produto");
      return res.json();
    })
    .then(data => {
      resultadoDiv.innerText = `✅ Produto adicionado com sucesso!`;
      document.getElementById("form-add").style.display = "none";
      document.getElementById("newName").value = "";
      document.getElementById("newClass").value = "";
      ultimoCodigoDetectado = "";
    })
    .catch(err => {
      resultadoDiv.innerText = `Erro: ${err.message}`;
    });
}
