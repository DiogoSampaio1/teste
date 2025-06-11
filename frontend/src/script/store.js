// Function to parse JWT token
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
    console.error('Error parsing JWT:', e); // Added error logging for parseJwt
    return null;
  }
}

let logoutTimeoutId = null;

// Assuming 'createStore' is a function that sets up a Vuex-like store.
// If you are using Vuex, ensure it's imported correctly.
// For example: import { createStore } from 'vuex';
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
      console.log('Login Success: Token and user info set in localStorage.', { ist_number, token }); // Added log
    },
    loginFailure(state, error) {
      state.loggedIn = false;
      state.ist_number = '';
      state.token = '';
      state.error = error;

      console.log('Login Failure: Clearing localStorage items.'); // Added log
      localStorage.removeItem('loggedIn');
      localStorage.removeItem('ist_number');
      localStorage.removeItem('token');
      console.log('Login Failure: localStorage items cleared.'); // Added log
    },
    logout(state) {
      console.log('Logout Mutation: Attempting to clear localStorage.'); // Added log
      // Log the current token value before removal to confirm it's there
      console.log('Before removal, token in localStorage:', localStorage.getItem('token'));

      state.loggedIn = false;
      state.ist_number = '';
      state.token = '';
      state.error = null;

      // Remove items from localStorage
      localStorage.removeItem('loggedIn');
      localStorage.removeItem('ist_number');
      localStorage.removeItem('token');

      // Log the token value after removal to confirm it's gone
      console.log('After removal, token in localStorage:', localStorage.getItem('token'));
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

        // Clear any existing logout timeout
        if (logoutTimeoutId) {
          clearTimeout(logoutTimeoutId);
        }

        const decoded = parseJwt(access_token);
        if (decoded && decoded.exp) {
          // You can calculate the timeout based on the actual 'exp' claim from the JWT,
          // which is more accurate than a fixed 120 seconds if the server's expiry can vary.
          // const expiryTimeMs = decoded.exp * 1000; // Convert Unix timestamp to milliseconds
          // const currentTimeMs = Date.now();
          // const timeout = expiryTimeMs - currentTimeMs;

          // Keeping your original fixed timeout for testing as requested
          const timeout = 120 * 1000; // 120 segundos para testes

          console.log(`Setting automatic logout timeout for ${timeout / 1000} seconds.`); // Added log
          logoutTimeoutId = setTimeout(() => {
            console.log('Automatic logout triggered by setTimeout.');
            dispatch('logout'); // This dispatches the logout action, which clears localStorage
            alert('Sessão expirada. Faça login novamente.'); // Alert user after logout state is set
          }, timeout);
        }


        return { ist_number: uid, access_token };
      } catch (error) {
        if (!error.message) {
          commit('loginFailure', 'Erro ao efetuar login');
          throw new Error('Erro ao efetuar login');
        }
        console.error('Login Action Error:', error); // Added error log
        throw error;
      }
    },

    logout({ commit }) {
      console.log('Logout Action: Clearing timeout and committing logout mutation.'); // Added log
      if (logoutTimeoutId) {
        clearTimeout(logoutTimeoutId);
        logoutTimeoutId = null;
      }
      commit('logout'); // Call the mutation to update state and clear localStorage
    },

    async fetchWithAuth({ state, dispatch }, { url, options = {} }) {
      if (!state.token) {
        console.warn('fetchWithAuth: No token found in state. Dispatching logout and throwing error.'); // Added log
        dispatch('logout');
        throw new Error('Não autenticado');
      }

      const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        Authorization: `Bearer ${state.token}`,
      };

      let response;
      try {
        response = await fetch(url, { ...options, headers });
      } catch (networkError) {
        console.error('fetchWithAuth: Network error during fetch:', networkError); // Added network error log
        throw new Error('Erro de rede ao acessar o servidor.');
      }


      if (response.status === 401) {
        console.warn('fetchWithAuth: Received 401 Unauthorized status. Dispatching logout.'); // Added log
        dispatch('logout'); // Dispatch logout if token is invalid or expired (on backend)
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      return response;
    },
  },
});