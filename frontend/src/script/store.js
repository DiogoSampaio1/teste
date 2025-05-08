import { createStore } from 'vuex';
import axios from 'axios';

// Interceptor para incluir token em todas as requisições
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
    user_id: localStorage.getItem('user_id'),
    token: localStorage.getItem('token') || '',
    error: null,
  },
  mutations: {
    loginSuccess(state, { user_id, token }) {
      state.loggedIn = true;
      state.user_id = user_id;
      state.token = token;
      state.error = null;

      localStorage.setItem('loggedIn', 'true');
      localStorage.setItem('user_id', user_id);
      localStorage.setItem('token', token);
    },
    loginFailure(state, error) {
      state.loggedIn = false;
      state.user_id = '';
      state.token = '';
      state.error = error;

      localStorage.removeItem('loggedIn');
      localStorage.removeItem('user_id');
      localStorage.removeItem('token');
    },
    logout(state) {
      state.loggedIn = false;
      state.user_id = '';
      state.token = '';
      state.error = null;

      localStorage.removeItem('loggedIn');
      localStorage.removeItem('user_id');
      localStorage.removeItem('token');
    },
  },
  actions: {
    async login({ commit }, { user_id, passphrase }) {
      try {
        const response = await axios.post('/login', {
          user_id,
          passphrase,
        });

        const { user_id: uid, access_token } = response.data;

        commit('loginSuccess', {
          user_id: uid,
          token: access_token,
        });

        return { user_id: uid, access_token };
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
