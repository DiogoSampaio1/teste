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

document.getElementById('placeAmount').addEventListener('input', function() {
  if (this.value.length > 5) {
      this.value = this.value.slice(0, 5);
  }
});

document.getElementById('newName').addEventListener('input', function () {
  if (this.value.length > 30) {
    this.value = this.value.slice(0, 30);
  }
})

document.getElementById('newCode').addEventListener('input', function() {
  if (this.value.length > 30) {
    this.value = this.value.slice(0, 30);
  }
})

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

function tratarCodigoLido(decodedText) {
  const resultadoDiv = document.getElementById("resultado");
  const contentDiv = document.getElementById("content");
  const formAdd = document.getElementById("form-add");

  fetch(`${URL}/products_scan?product_code=${decodedText}`)
    .then(res => {
      if (!res.ok) throw new Error("Produto não encontrado");
      return res.json();
    })
    .then(produtos => {
      if (!produtos.length) {
        throw new Error("Produto não encontrado");
      }

      // Exibir lista de produtos
      resultadoDiv.style.display = "flex";

      // Montar HTML com todos os produtos
      let html = `<h2>✅ Produtos encontrados:</h2>`;
      let content = "";

      produtos.forEach((produto, index) => {
        content += `
          <div class="product-container" data-index="${index}">
            <section class="info">
              <div style="display: none;"><span>ID:</span> <i>${produto.product_id}</i></div>
              <div><span>Nome:</span> <i>${produto.product_name}</i></div>
              <div><span>Código:</span> <i>${produto.product_code}</i></div>
              <div><span>Classe:</span> <i>${produto.class_name}</i></div>
              <div><span>Localização:</span> <i>${produto.room_name}</i></div>
              <div><span>Quantidade:</span> <i>${produto.product_amount}</i></div>
            </section>
            <hr>
            <section class="icon">
              <button class="edit-button no-style" data-index="${index}" style="cursor:pointer;">✏️</button>
            </section>
          </div>
        `;
      });

      contentDiv.innerHTML = content;

      // Esconder formulário de adicionar (caso estivesse aberto)
      formAdd.style.display = "none";

      // Adicionar evento para todos os botões de editar
      document.querySelectorAll(".edit-button").forEach(button => {
        button.addEventListener("click", (e) => {
          const idx = e.target.getAttribute("data-index");
          const produto = produtos[idx];

          const amountInput = document.getElementById("editAmount");
          const locationInput = document.getElementById("editLocation");

          if (!amountInput || !locationInput) {
            console.error("Elemento editAmount ou editLocation não encontrado");
            return;
          }

          amountInput.value = produto.product_amount;
          locationInput.value = produto.room_name;

          currentEditCode = produto.product_id;
          document.getElementById("edit-alert").style.display = "block";
        });
        document.getElementById('editAmount').value = "1"; // Volta ao valor original
      });
    })
    .catch(() => {
      // Produto não encontrado
      resultadoDiv.style.display = "block";
      resultadoDiv.innerText = `❌ Produto não encontrado para o código "${decodedText}".`;

      // Mostrar formulário para adicionar novo produto
      formAdd.style.display = "block";

      // Preenche o campo do código manualmente e bloqueia edição
      const codeInput = document.getElementById("newCode");
      if (codeInput) {
        codeInput.value = decodedText;
        codeInput.readOnly = true;
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
      product_id: currentEditCode,
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
  const input = document.getElementById('placeAmount').value;
  document.getElementById('form-add').style.display = 'block';

  const codeInput = document.getElementById("newCode");
  codeInput.value = '';
  codeInput.readOnly = false;
  ultimoCodigoDetectado = '';
  document.getElementById('newCode').focus();
  input.value = "1";
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

function carregarClasses() {
      fetch(`${URL}/class`)
        .then(response => response.json())
        .then(data => {
          const datalist = document.getElementById('class-list');
          datalist.innerHTML = ''; // limpa opções anteriores
          const nomesUnicos = [...new Set(data.map(classes => classes.class_name))].sort((a, b) => a.localeCompare(b));
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
    class_name: classe,
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
    })
    .catch(err => {
      showAlert(err.message);
      scannerAtivo = false;
    });
  focusInput();
  setTimeout(() => {
    window.location.reload()
  }, 500);
}

document.addEventListener('DOMContentLoaded', () => {
  carregarLocalizacoes();
  carregarClasses();
});

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('ist_number');
  window.location = 'Login.html';
}