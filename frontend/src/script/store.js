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

// Verifica expiração ao iniciar a app
function isTokenExpired(token) {
  const decoded = parseJwt(token);
  if (!decoded || !decoded.exp) return true;
  return decoded.exp * 1000 < Date.now();
}

// Dados iniciais com verificação de expiração
const initialToken = localStorage.getItem('token');
const tokenIsExpired = initialToken ? isTokenExpired(initialToken) : true;

if (tokenIsExpired) {
  localStorage.removeItem('loggedIn');
  localStorage.removeItem('ist_number');
  localStorage.removeItem('token');
}

export default createStore({
  state: {
    loggedIn: !tokenIsExpired && localStorage.getItem('loggedIn') === 'true',
    ist_number: !tokenIsExpired ? localStorage.getItem('ist_number') : '',
    token: !tokenIsExpired ? initialToken : '',
    error: null,
  },
  mutations: {
    loginSuccess(state, { ist_number, token }) {
      state.loggedIn = true;
      state.ist_number = ist_number;
      state.token = token;
      state.error = null;

      localStorage.setItem('loggedIn', 'true');
      localStorage.setItem('ist_number', ist_number);
      localStorage.setItem('token', token);
    },
    loginFailure(state, error) {
      state.loggedIn = false;
      state.ist_number = '';
      state.token = '';
      state.error = error;

      localStorage.removeItem('loggedIn');
      localStorage.removeItem('ist_number');
      localStorage.removeItem('token');
    },
    logout(state) {
      state.loggedIn = false;
      state.ist_number = '';
      state.token = '';
      state.error = null;

      localStorage.removeItem('loggedIn');
      localStorage.removeItem('ist_number');
      localStorage.removeItem('token');
    },
  },
  actions: {
    async login({ commit, dispatch }, { ist_number, passphrase }) {
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
          commit('loginFailure', message);
          throw new Error(message);
        }

        const data = await response.json();
        const { ist_number: uid, access_token } = data;

        commit('loginSuccess', {
          ist_number: uid,
          token: access_token,
        });

        // Limpa timeout anterior se existir
        if (logoutTimeoutId) {
          clearTimeout(logoutTimeoutId);
        }

        // Define logout automático com base na expiração real do token
        const decoded = parseJwt(access_token);
        if (decoded && decoded.exp) {
          const expMs = decoded.exp * 1000;
          const nowMs = Date.now();
          const timeout = expMs - nowMs;

          if (timeout > 0) {
            logoutTimeoutId = setTimeout(() => {
              console.log('Logout automático disparado');
              dispatch('logout');
              alert('Sessão expirada. Faça login novamente.');
            }, timeout);
          }
        }

        return { ist_number: uid, access_token };
      } catch (error) {
        if (!error.message) {
          commit('loginFailure', 'Erro ao efetuar login');
          throw new Error('Erro ao efetuar login');
        }
        throw error;
      }
    },

    logout({ commit }) {
      if (logoutTimeoutId) {
        clearTimeout(logoutTimeoutId);
        logoutTimeoutId = null;
      }
      commit('logout');
    },

    async fetchWithAuth({ state, dispatch }, { url, options = {} }) {
      if (!state.token) {
        dispatch('logout');
        throw new Error('Não autenticado');
      }

      const decoded = parseJwt(state.token);
      if (!decoded || decoded.exp * 1000 < Date.now()) {
        dispatch('logout');
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        Authorization: `Bearer ${state.token}`,
      };

      const response = await fetch(url, { ...options, headers });

      if (response.status === 401) {
        dispatch('logout');
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      return response;
    },
  },
});
