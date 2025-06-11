function parseJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

let logoutTimeoutId = null;

// Inicialização automática ao carregar a página
(function checkTokenOnLoad() {
  const token = localStorage.getItem('token');
  if (token) {
    const decoded = parseJwt(token);
    const now = Math.floor(Date.now() / 1000);
    if (!decoded || decoded.exp < now) {
      console.log('Token expirado ao carregar');
      logout();
    } else {
      console.log('Token válido. Login mantido.');
      // Opcional: reiniciar o timeout
      startAutoLogout(120 * 1000); // 120 segundos
    }
  }
})();

async function login(ist_number, passphrase) {
  try {
    const response = await fetch('https://100.68.0.76:8080/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ist_number, passphrase }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const message = errorData.message || 'Erro ao efetuar login';
      throw new Error(message);
    }

    const data = await response.json();
    const { ist_number: uid, access_token } = data;

    localStorage.setItem('loggedIn', 'true');
    localStorage.setItem('ist_number', uid);
    localStorage.setItem('token', access_token);

    console.log('Login realizado com sucesso');

    // Inicia logout automático
    startAutoLogout(120 * 1000); // 120 segundos

    return { ist_number: uid, access_token };
  } catch (err) {
    console.error('Erro no login:', err.message);
    logout();
    throw err;
  }
}

function logout() {
  console.log('Executando logout');

  localStorage.removeItem('loggedIn');
  localStorage.removeItem('ist_number');
  localStorage.removeItem('token');

  if (logoutTimeoutId) {
    clearTimeout(logoutTimeoutId);
    logoutTimeoutId = null;
  }

  window.location = 'Login.html';
}

function startAutoLogout(timeout) {
  if (logoutTimeoutId) {
    clearTimeout(logoutTimeoutId);
  }

  logoutTimeoutId = setTimeout(() => {
    console.log('Logout automático disparado');
    logout();
    alert('Sessão expirada. Faça login novamente.');
  }, timeout);
}
