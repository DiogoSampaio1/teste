function openSidebar() {
    let icon = document.getElementById('ham-men');
    let sidebar = document.getElementById('nav');

    sidebar.classList.toggle('active');

    if (sidebar.style.contain('active')) {
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-xmark');
    } else {
        icon.classList.remove('fa-xmark');
        icon.classList.add('fa-bars');
    }
}

