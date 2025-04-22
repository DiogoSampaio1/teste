import .:. from .:.;

const routes: Array<RouteRecordRaw> = [
    { path: '/people', component: People},
    { path: '/User', component: Users, meta: { requiresAuth: true } },
    { path: '/', redirect: '/geral' } // Redireciona para a página de login por padrão
  ];
  
  const router = createRouter({
    history: createWebHistory(),
    routes,
  });
  export default router;