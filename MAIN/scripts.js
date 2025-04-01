window.onload = function() {
    const start = document.getElementsByClassName('start')[0];
    const content = document.getElementsByClassName('avaliações')[0];

    document.body.addEventListener('click', function() {
        start.style.display = 'none';  
        content.style.display = 'block'; 
    });
};
