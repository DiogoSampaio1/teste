import { createStore } from 'vuex';

// Função para decodificar JWT
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

// Verificação inicial do token ao carregar a app
let token = localStorage.getItem('token') || '';
let loggedIn = localStorage.getItem('loggedIn') === 'true';
let ist_number = localStorage.getItem('ist_number');

if (token) {
  const decoded = parseJwt(token);
  const now = Math.floor(Date.now() / 1000);
  if (!decoded || decoded.exp < now) {
    console.log('Token expirado ao carregar a página');
    loggedIn = false;
    ist_number = '';
    token = '';
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('ist_number');
    localStorage.removeItem('token');
    window.location = 'Login.html';
  }
}

let logoutTimeoutId = null;

const store = createStore({
  state: {
    loggedIn,
    ist_number,
    token,
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
    async login({ commit }, { ist_number, passphrase }) {
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

        // Clear qualquer timeout anterior
        if (logoutTimeoutId) {
          clearTimeout(logoutTimeoutId);
        }

        const decoded = parseJwt(access_token);
        if (decoded && decoded.exp) {
          const timeout = 120 * 1000; // 120 segundos para testes

          // Usando store.dispatch diretamente para manter escopo
          logoutTimeoutId = setTimeout(async () => {
            console.log('Logout automático disparado');
            await store.dispatch('logout');
            alert('Sessão expirada. Faça login novamente.');
          }, timeout);
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
      window.location = 'Login.html';
    },

    async fetchWithAuth({ state, dispatch }, { url, options = {} }) {
      if (!state.token) {
        await dispatch('logout');
        throw new Error('Não autenticado');
      }

      const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        Authorization: `Bearer ${state.token}`,
      };

      const response = await fetch(url, { ...options, headers });

      if (response.status === 401) {
        await dispatch('logout');
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      return response;
    },
  },
});

export default store;
