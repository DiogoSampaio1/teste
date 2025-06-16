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

        if (logoutTimeoutId) {
          clearTimeout(logoutTimeoutId);
        }

        const decoded = parseJwt(access_token);
        
        if (decoded && decoded.exp) {
  const expirationTime = decoded.exp * 1000; // JWT exp em segundos
  const currentTime = Date.now();
  const timeout = expirationTime - currentTime;

  if (timeout > 0) {
    logoutTimeoutId = setTimeout(() => {
      console.log('Logout automático disparado');
      dispatch('logout');
      alert('Sessão expirada. Faça login novamente.');
      window.location = '../components/Login.html';
    }, timeout);
  } else {
    // Já expirou
    dispatch('logout');
    alert('Sessão expirada. Faça login novamente.');
    window.location = '../components/Login.html';
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
