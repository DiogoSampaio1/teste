document.addEventListener("DOMContentLoaded", () => {
    const userNameElement = document.getElementById('user-name');
    const loggedInUser = localStorage.getItem('ist_number');
  
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
    let menu = document.getElementById('menu-burguer')

    sidebar.classList.toggle('active');
    menu.classList.toggle('fixed');

    if (sidebar.classList.contains('active')) {
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-xmark');
    } else {
        icon.classList.remove('fa-xmark');
        icon.classList.add('fa-bars');
    }
};

const URL = 'https://100.68.0.76:8080';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

function userPlace() {
  const userDiv = document.getElementById('user-name');
  const nav = document.getElementById('nav');
  const header = document.getElementById('cont-right-side-header');

  if (window.innerWidth <= 768) {
    nav.appendChild(userDiv);
  } else if (window.innerWidth >= 768){
      header.appendChild(userDiv);
  }
}

window.addEventListener('resize', userPlace);
window.addEventListener('load', userPlace);