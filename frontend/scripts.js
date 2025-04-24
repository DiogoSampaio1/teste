let scannerAtivo = false;

  function iniciarScanner() {
    const readerDiv = document.getElementById("reader");
    const resultadoDiv = document.getElementById("resultado");

    if (scannerAtivo) return; // Evita múltiplas ativações

    scannerAtivo = true;
    readerDiv.style.display = "block";

    const html5QrCode = new Html5Qrcode("reader");

    html5QrCode.start(
      { facingMode: "environment" },
      {
        fps: 60,
        qrbox: 250
      },
      (decodedText, decodedResult) => {
        resultadoDiv.innerText = `📦 Código detectado: ${decodedText}`;
        html5QrCode.stop().then(() => {
          scannerAtivo = false;
          readerDiv.style.display = "none";
        });
      },
      (errorMessage) => {
        // Pode mostrar erros aqui
      }
    ).catch(err => {
      resultadoDiv.innerText = `Erro ao aceder à câmera`;
      scannerAtivo = false;
    });
  }