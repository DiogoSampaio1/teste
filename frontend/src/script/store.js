import axios from 'axios';


axios.defaults.baseURL = 'https://100.68.0.76:8080';

axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

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
    async login({ commit }, { ist_number, passphrase }) {
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

        return { ist_number: uid, access_token };
      } catch (error) {
        const message =
          error.response?.data?.message || 'Erro ao efetuar login';
        commit('loginFailure', message);
        throw new Error(message);
      }
    },

    logout({ commit }) {
      commit('logout');
    },
  },
});
