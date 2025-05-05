const NGROK_URL = 'http://127.0.0.1:5000';
let scannerAtivo = false;
let ultimoCodigoDetectado = "";
let ultimoCodigoProcessado = null;  // Controla se o código foi processado anteriormente
let html5QrCode = null;
let scannerTravado = false;  // Bloqueia o scanner por 1 segundo após cada leitura

function iniciarScanner() {
  const readerDiv = document.getElementById("reader");
  const resultadoDiv = document.getElementById("resultado");

  // Verifica se o scanner já está ativo, para não iniciar novamente
  if (scannerAtivo) return;

  if (!html5QrCode) {
    html5QrCode = new Html5Qrcode("reader");
  }

  // Resetando variáveis ao iniciar um novo scan
  ultimoCodigoProcessado = null;
  scannerTravado = false;

  scannerAtivo = true;
  readerDiv.style.display = "block";

  html5QrCode.start(
    { facingMode: "environment" },
    { fps: 60, qrbox: { width: 250, height: 300 } },
    (decodedText) => {
      // Evita leituras duplicadas rapidamente
      if (decodedText === ultimoCodigoProcessado || scannerTravado) {
        return;
      }

      // Bloqueia o scanner por 1 segundo
      scannerTravado = true;
      setTimeout(() => {
        scannerTravado = false;
      }, 1000);

      // Atualiza o último código processado
      ultimoCodigoProcessado = decodedText;

      tratarCodigoLido(decodedText);

      // Parar o scanner após a leitura do código
      html5QrCode.stop().then(() => {
        scannerAtivo = false;
        readerDiv.style.display = "none";
      });
    },
    (errorMessage) => {
      // Ignora erros de leitura
    }
  ).catch(err => {
    resultadoDiv.innerText = "Erro ao acessar a câmera";
    scannerAtivo = false;
  });
}

// Função para focar no campo de entrada do leitor USB (campo invisível)
function focusInput() {
  const usbScannerInput = document.getElementById("usb-scanner");

  // Temporary styling for debugging
  usbScannerInput.style.display = "block";
  usbScannerInput.style.border = "1px solid red";
  usbScannerInput.focus();


  setTimeout(() => {
    usbScannerInput.style.display = "none";
    usbScannerInput.style.border = "none"; // Remove temporary border
  }, 500); // Increased delay to 500ms
}

// Captura do leitor USB (simula teclado)
let codigoAtual = '';
let timeoutScanner = null;

document.getElementById("usb-scanner").addEventListener("input", (e) => {
  clearTimeout(timeoutScanner);

  codigoAtual = e.target.value.trim();

  // Espera 300ms sem digitação pra processar
  timeoutScanner = setTimeout(() => {
    if (codigoAtual.length >= 10) {
      tratarCodigoLido(codigoAtual);
      e.target.value = '';
      codigoAtual = '';
    }
  }, 300);
});

// Função para tratar o código lido (câmera ou USB)
function tratarCodigoLido(decodedText) {
  const resultadoDiv = document.getElementById("resultado");
  const formAdd = document.getElementById("form-add");

  // Não mostrar o decodedText diretamente ao usuário
  fetch(`${NGROK_URL}/products_scan?product_code=${decodedText}`)
    .then(res => {
      if (!res.ok) throw new Error("Produto não encontrado");
      return res.json();
    })
    .then(produto => {
      resultadoDiv.style.display = 'flex';
      resultadoDiv.innerHTML = `
    ✅ Produto encontrado:<br><br>
      Nome: <i>${produto.product_name}</i><br>
      Código: <i>${produto.product_code}</i><br>
      Classe: <i>${produto.product_class}</i>
      `;
    })
    .catch(() => {
      // Produto não encontrado
      resultadoDiv.innerText = `❌ Produto não encontrado para o código "${decodedText}".`;

      // Mostrar formulário para adicionar novo produto
      formAdd.style.display = "block";

      // Preenche automaticamente o código no formulário (opcional)
      ultimoCodigoDetectado = decodedText;

      // Dar foco no primeiro campo do formulário para facilitar
      document.getElementById("newName").focus();
    });
}

function closeDialog() {
  document.getElementById('form-add').style.display = 'none';
  document.getElementById('resultado').innerText = '';

  location.reload();
}

function showAlert(message) {
  document.getElementById('alert-message').textContent = message;
  document.getElementById('alert').style.display = 'block';
}

function closeAlert(){
  document.getElementById('alert').style.display = 'none';
}

// Função para adicionar o produto após o preenchimento do formulário
function adicionarProduto() {
  const nome = document.getElementById("newName").value.trim();
  const classe = document.getElementById("newClass").value.trim();
  const amount = document.getElementById("placeAmount").value.trim();
  const resultadoDiv = document.getElementById("resultado");

  if (!nome || !classe || !amount || !ultimoCodigoDetectado) {
    showAlert("Preencha todos os campos.");
    return;
  }

  const novoProduto = {
    product_name: nome,
    product_code: ultimoCodigoDetectado,
    product_class: classe,
    product_amount: amount
  };

  fetch(`${NGROK_URL}/products`, {
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
    .then(() => {
      resultadoDiv.innerText = "✅ Produto adicionado com sucesso!";
      document.getElementById("form-add").style.display = "none";
      document.getElementById("newName").value = "";
      document.getElementById("newClass").value = "";
      document.getElementById("placeAmount").value = "";
      ultimoCodigoDetectado = "";

      // Não reiniciar o scanner automaticamente após a adição
    })
    .catch(err => {
      resultadoDiv.innerText = `Erro: ${err.message}`;
    });

    setTimeout(() => {
      location.reload()
    }, 500);

    scannerAtivo = false;
}
