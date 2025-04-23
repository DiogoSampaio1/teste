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
}

// Fetch on db
document.addEventListener("DOMContentLoaded", () => {
    fetch('/products')
      .then(response => {
        if (!response.ok) throw new Error('Erro na requisição');
        return response.json();
      })
      .then(data => {
        const tableBody = document.getElementById('items-table');
        tableBody.innerHTML = ''; // limpa antes de inserir os novos
  
        data.forEach(product => {
          const row = document.createElement('tr');
  
          row.innerHTML = `
            <td>${product.product_id}</td>
            <td>${product.product_name}</td>
            <td>${product.product_code}</td>
            <td>${product.product_class}</td>
          `;
  
          tableBody.appendChild(row);
        });
      })
      .catch(error => {
        console.error('Erro ao buscar os produtos:', error);
      });
  });