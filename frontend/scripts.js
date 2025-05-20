const user = localStorage.getItem('ist_number');
const logInfo = document.getElementById('log-info');
let icon = document.getElementById('log-icon');
let scannerAtivo = false;
let ultimoCodigoDetectado = "";
let ultimoCodigoProcessado = null;
let currentEditCode = null;
let html5QrCode = null;
let scannerTravado = false;  // Bloqueia o scanner por 1 segundo após cada leitura

if(user) {
  logInfo.textContent = "Logout";
  icon.innerHTML = '<i class="fa-solid fa-arrow-right-from-bracket"></i>'
} else {
  logInfo.textContent = "Login";
  icon.innerHTML = '<i class="fa-solid fa-arrow-right-to-bracket"></i>';
}

document.getElementById('editAmount').addEventListener('keypress', function(event) {
  if (!/[0-9,.]/.test(event.key)) {
    event.preventDefault();
  }
});

document.getElementById('editAmount').addEventListener('keypress', function(event) {
  if (event.key < "0" || event.key > "9") {
    event.preventDefault();
  }
});

document.getElementById('editAmount').addEventListener('input', function() {
  if (this.value.length > 5) {
      this.value = this.value.slice(0, 5);
  }
});

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
    resultadoDiv.innerText = "Erro ao aceder à câmara";
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
  fetch(`${URL}/products_scan?product_code=${decodedText}`)
    .then(res => {
      if (!res.ok) throw new Error("Produto não encontrado");
      return res.json();
    })
    .then(produto => {
      resultadoDiv.style.display = 'flex';
      resultadoDiv.innerHTML = `
      <h2>✅Produto encontrado:</h2>
      <div class="product-container">
        <section class="info">
          <div><span>Nome:</span> <i>${produto.product_name}</i></div>
          <div><span>Código:</span> <i>${produto.product_code}</i></div>
          <div><span>Classe:</span> <i>${produto.product_class}</i></div>
          <div><span>Localização:</span> <i>${produto.room_name}</i></div>
          <div><span>Quantidade:</span> <i>${produto.product_amount}</i></div>
        </section>
        <hr>
        <section class="icon">
          <i class="fa-solid fa-pencil edit-icon" style="cursor: pointer;"></i>
        </section>
      </div>
      `;
      document.querySelector('.edit-icon').addEventListener('click', () => {
        const amountInput = document.getElementById('editAmount');
        const locationInput = document.getElementById('editLocation');
      
          if (!amountInput || !locationInput) {
            console.error("Elemento editAmount ou editLocation não encontrado");
            return;
          }
        
          amountInput.value = produto.product_amount;
          locationInput.value = produto.room_name; // <- esta linha preenche a localização atual
        
          currentEditCode = produto.product_code;
          document.getElementById('edit-alert').style.display = 'block';
      });
    })
    .catch(() => {
      // Produto não encontrado
      resultadoDiv.innerText = `❌ Produto não encontrado para o código "${decodedText}".`;

      // Mostrar formulário para adicionar novo produto
      formAdd.style.display = "block";

      // Preenche o campo do código manualmente
      const codeInput = document.getElementById("newCode");
      if (codeInput) {
        codeInput.value = decodedText;
        codeInput.readOnly = true; // evita edição se o código foi escaneado
      }

      // Dar foco no primeiro campo do formulário para facilitar
      document.getElementById("newName").focus();
    });
}

function confirmOk() {
  const newAmount = document.getElementById("editAmount")?.value.trim();
  const newLocation = document.getElementById("editLocation")?.value.trim();

  if (!newAmount || !newLocation || !currentEditCode) {
    showAlert("Preencha os campos corretamente.");
    return;
  }

  fetch(`${URL}/products_scan`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      product_code: currentEditCode,
      room_name: newLocation,
      product_amount: newAmount
    })
  })
    .then(res => {
      if (!res.ok) throw new Error("Erro ao atualizar produto");
      return res.json();
    })
    .then(() => {
      document.getElementById("edit-alert").style.display = "none";
      location.reload();
    })
    .catch(err => {
      showAlert("Erro ao atualizar produto: " + err.message);
    });
}

function closeEditDialog() {
  document.getElementById('edit-alert').style.display = 'none';
  currentEditCode = null;
}

function openDialog(){
  document.getElementById('form-add').style.display = 'block';

  const codeInput = document.getElementById("newCode");
  codeInput.value = '';
  codeInput.readOnly = false;
  ultimoCodigoDetectado = '';
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

function alterarQuantia(delta){
  const input = document.getElementById('placeAmount');
  let valorAtual = parseInt(input.value, 10) || 0;
  let novoValor = valorAtual + delta;

  if (novoValor < 0) novoValor = 0
  input.value = novoValor;
}

function alterarEditQuantia(delta){
  const input = document.getElementById('editAmount');
  let valorAtual = parseInt(input.value, 10) || 0;
  let novoValor = valorAtual + delta;

  if (novoValor < 0) novoValor = 0
  input.value = novoValor;
}

function carregarLocalizacoes() {
  fetch(`${URL}/room`)
    .then(response => response.json())
    .then(data => {
      const datalist = document.getElementById('location-list');
      datalist.innerHTML = ''; // limpa opções anteriores
      const nomesUnicos = [...new Set(data.map(room => room.room_name))].sort((a, b) => a.localeCompare(b));
      nomesUnicos.forEach(nome => {
        const option = document.createElement('option');
        option.value = nome;
        datalist.appendChild(option);
      });
    })
    .catch(error => {
      console.error('Erro ao carregar localizações:', error);
    });
}


// Função para adicionar o produto após o preenchimento do formulário
function adicionarProduto() {
  const code = document.getElementById("newCode").value.trim()
  const nome = document.getElementById("newName").value.trim();
  const classe = document.getElementById("newClass").value.trim();
  const amount = document.getElementById("placeAmount").value.trim();
  const locations = document.getElementById("newLocation").value.trim();
  const resultadoDiv = document.getElementById("resultado");

  if (!code || !nome || !classe || !amount || !locations) {
    showAlert("Preencha todos os campos.");
    return;
  }

  const novoProduto = {
    product_code: code,
    product_name: nome,
    product_class: classe,
    room_name: locations,
    product_amount: amount
  };

  fetch(`${URL}/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(novoProduto)
  })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Erro ao adicionar produto.");
      }
      return data;
    })
    .then(() => {
      resultadoDiv.innerText = "✅ Produto adicionado com sucesso!";
      document.getElementById("form-add").style.display = "none";
      document.getElementById("newName").value = "";
      document.getElementById("newClass").value = "";
      document.getElementById("newLocation").value = "";
      ultimoCodigoDetectado = "";
      scannerAtivo = false;

      // Só recarrega a página se tudo deu certo
      setTimeout(() => {
        location.reload();
      }, 500);
    })
    .catch(err => {
      showAlert(err.message);
      scannerAtivo = false;
    });
}

document.addEventListener('DOMContentLoaded', () => {
  carregarLocalizacoes();
});

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('ist_number');
  window.location = 'Login.html';
}