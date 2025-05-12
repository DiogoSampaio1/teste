document.addEventListener("DOMContentLoaded", () => {
    const userNameElement = document.getElementById('user-name');
    const loggedInUser = localStorage.getItem('user');
  
    if (userNameElement && loggedInUser) {
      userNameElement.textContent = loggedInUser;
    } else {
      console.log("Elemento 'user-name' não encontrado ou usuário não logado.");
    }
  });
  
// Sidebar
function openSidebar() {
    let icon = document.getElementById('ham-men');
    let sidebar = document.getElementById('nav');

    sidebar.classList.toggle('active');

    if (sidebar.classList.contains('active')) {
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-xmark');
    } else {
        icon.classList.remove('fa-xmark');
        icon.classList.add('fa-bars');
    }
};