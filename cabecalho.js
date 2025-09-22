const btn = document.getElementById('btn-lista');
    const lista = document.getElementById('lista');

    btn.addEventListener('click', () => {
        // Alterna entre mostrar e esconder
        if (lista.style.display === 'block') {
        lista.style.display = 'none';
        } else {
        lista.style.display = 'block';
        }
    });

    // Opcional: fecha a lista ao clicar fora dela
    document.addEventListener('click', (e) => {
        if (!btn.contains(e.target) && !lista.contains(e.target)) {
        lista.style.display = 'none';
        }
    });