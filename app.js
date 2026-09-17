// --- SYSTÈME DE CONNEXION (BARRIÈRE FRONT-END) ---
const CORRECT_PASSWORD = "Radar-HW-2026!M&A"; 

document.addEventListener('DOMContentLoaded', () => {
    const loginOverlay = document.getElementById('login-overlay');
    const mainApp = document.getElementById('main-app');
    const btnLogin = document.getElementById('btn-login');
    const passwordInput = document.getElementById('password-input');
    const loginError = document.getElementById('login-error');

    if (sessionStorage.getItem('hw_radar_auth') === 'true') {
        loginOverlay.style.display = 'none';
        mainApp.classList.remove('dashboard-hidden');
    }

    function checkPassword() {
        if (passwordInput.value === CORRECT_PASSWORD) {
            sessionStorage.setItem('hw_radar_auth', 'true');
            loginOverlay.style.display = 'none';
            mainApp.classList.remove('dashboard-hidden');
        } else {
            loginError.style.display = 'block';
            passwordInput.value = '';
        }
    }

    btnLogin.addEventListener('click', checkPassword);
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkPassword();
    });

    // NOUVEAU : Chargement initial des données au démarrage
    loadData();
});

// --- GESTION DES DONNÉES ---
let allArticles = [];
let currentSearchType = 'all';

document.getElementById('btn-levee').addEventListener('click', () => displaySearch('levee'));
document.getElementById('btn-ma').addEventListener('click', () => displaySearch('ma'));
document.getElementById('btn-all').addEventListener('click', () => displaySearch('all'));
document.getElementById('time-filter').addEventListener('change', () => displaySearch(currentSearchType));

function loadData() {
    const loadingDiv = document.getElementById('loading');
    const tbody = document.getElementById('results-body');
    
    loadingDiv.style.display = 'block';
    loadingDiv.textContent = "Chargement de la base de données...";
    
    // On lit le fichier généré par le robot chaque matin
    fetch('data.json')
        .then(response => {
            if (!response.ok) throw new Error("Fichier data.json introuvable. Le robot doit tourner au moins une fois !");
            return response.json();
        })
        .then(data => {
            loadingDiv.style.display = 'none';
            // On convertit les dates texte en vrais objets Date JavaScript
            allArticles = data.map(article => ({
                ...article,
                date: new Date(article.date)
            }));
            displaySearch('all'); // Affiche tout par défaut au lancement
        })
        .catch(error => {
            loadingDiv.textContent = error.message;
            loadingDiv.style.color = "red";
        });
}

function displaySearch(type) {
    currentSearchType = type;
    
    const timeFilter = document.getElementById('time-filter').value;
    const now = new Date();
    let limitDate = new Date(0);
    if (timeFilter !== 'all') {
        limitDate = new Date();
        limitDate.setDate(now.getDate() - parseInt(timeFilter));
    }
    
    const tbody = document.getElementById('results-body');
    tbody.innerHTML = ''; 

    // Mots-clés pour différencier Levées et M&A à l'affichage
    const regexLevee = /(lève|levée|fonds|financement|millions?|milliards?|série|investit|raises|funding|series|secures|amorçage|seed|capital|tour de table|clôture|backing|backed|grant|subvention|dette|crowdfunding|ipo|papernest|selectra)/i;
    const regexMA = /(rachète|acquisition|acquiert|fusion|rachat|partenariat|passent chez|acquires|merger|buys|merges|s'offre|rejoint|absorbe|takeover|stake|participation|alliance|associe|joint venture|buyout|spin-off|reprend|intégration)/i;

    // On filtre la base de données selon le bouton cliqué et la date
    let filteredArticles = allArticles.filter(article => {
        if (article.date < limitDate) return false;
        
        const titleLower = article.title.toLowerCase();
        if (currentSearchType === 'levee' && !titleLower.match(regexLevee)) return false;
        if (currentSearchType === 'ma' && !titleLower.match(regexMA)) return false;
        
        return true;
    });

    // Tri par date décroissante
    filteredArticles.sort((a, b) => b.date - a.date);

    if (filteredArticles.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding: 30px;">Aucune opération trouvée avec ces filtres.</td></tr>`;
        return;
    }

    filteredArticles.forEach(article => {
        const tr = document.createElement('tr');
        const dateStr = article.date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric', year: 'numeric' });
        
        let secteurClass = "badge-autre";
        if(article.secteur === "Solaire") secteurClass = "badge-solaire"; 
        else if(article.secteur === "Rénovation") secteurClass = "badge-renovation"; 
        else if(article.secteur === "Batterie") secteurClass = "badge-batterie"; 
        else if(article.secteur === "Flexibilité") secteurClass = "badge-flexibilite"; 
        else if(article.secteur === "Énergie") secteurClass = "badge-energie"; 
        
        let entiteAffichage = article.entite ? article.entite : `<span class="entity-empty">-</span>`;

        tr.innerHTML = `
            <td class="date-cell">${dateStr}</td>
            <td><span class="badge ${secteurClass}">${article.secteur}</span></td>
            <td class="entity-cell">${entiteAffichage}</td>
            <td class="amount-cell">${article.montant}</td>
            <td>
                <a href="${article.link}" target="_blank" class="source-badge">${article.source}</a>
                <span class="article-title">${article.title}</span>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// --- GESTION DE LA FENÊTRE FONCTIONNEMENT (README) ---
const modal = document.getElementById('readme-modal');
const btnReadme = document.getElementById('btn-readme');
const spanClose = document.getElementsByClassName('close-modal')[0];

btnReadme.addEventListener('click', () => {
    modal.style.display = 'block';
    
    fetch('README.md')
        .then(response => {
            if(!response.ok) throw new Error("Fichier introuvable");
            return response.text();
        })
        .then(text => {
            document.getElementById('readme-content').innerHTML = marked.parse(text);
        })
        .catch(err => {
            document.getElementById('readme-content').innerHTML = "<p style='color:red;'>Erreur : Le fichier README.md n'a pas pu être chargé.</p>";
        });
});

spanClose.onclick = () => modal.style.display = 'none';
window.onclick = (event) => {
    if (event.target === modal) modal.style.display = 'none';
};
