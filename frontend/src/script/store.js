import axios from 'axios';

axios.defaults.baseURL = 'https://100.68.0.76:8080';

axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('Token enviado no header Authorization:', token);
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Função para decodificar o JWT e pegar o payload
function parseJwt(token) {
  try {
    const base64Payload = token.split('.')[1];
    const payload = atob(base64Payload);
    return JSON.parse(payload);
  } catch (e) {
    return null;
  }
}

// Variável para guardar o timeout do logout automático
let logoutTimeoutId = null;

export default createStore({
  state: {
    loggedIn: localStorage.getItem('loggedIn') === 'true',
    ist_number: localStorage.getItem('ist_number'),
    token: localStorage.getItem('token') || '',
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
        const response = await axios.post('/login', {
          ist_number,
          passphrase,
        });

        const { ist_number: uid, access_token } = response.data;

        commit('loginSuccess', {
          ist_number: uid,
          token: access_token,
        });

        if (logoutTimeoutId) {
          clearTimeout(logoutTimeoutId);
        }

        const decoded = parseJwt(access_token);
        if (decoded && decoded.exp) {
          const expTime = decoded.exp * 1000;
          const currentTime = Date.now();
          const timeout = expTime - currentTime;

          if (timeout > 0) {
            logoutTimeoutId = setTimeout(() => {
              dispatch('logout');
              alert('Sessão expirada. Faça login novamente.');
            }, timeout);
          } else {
            dispatch('logout');
          }
        }

        return { ist_number: uid, access_token };
      } catch (error) {
        const message =
          error.response?.data?.message || 'Erro ao efetuar login';
        commit('loginFailure', message);
        throw new Error(message);
      }
    },

    logout({ commit }) {
      if (logoutTimeoutId) {
        clearTimeout(logoutTimeoutId);
        logoutTimeoutId = null;
      }
      commit('logout');
    },
  },
});
