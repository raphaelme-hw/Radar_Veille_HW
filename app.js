const baseFeeds = [
    'https://www.pv-magazine.fr/feed/', 
    'https://energynews.pro/fr/feed/',
    'https://www.maddyness.com/feed/',
    'https://www.greenunivers.com/feed/',
    'https://techcrunch.com/category/greentech/feed/',
    'https://sifted.eu/feed/',
    'https://www.lesechos.fr/rss/tech-medias',
    'https://cleantechnica.com/feed/',
    'https://www.transition-energies.com/feed/'
];

const feeds = [];
const profondeur = 10; 

baseFeeds.forEach(url => {
    for (let i = 1; i <= profondeur; i++) {
        if (i === 1) feeds.push(url);
        else feeds.push(`${url}${url.includes('?') ? '&' : '?'}paged=${i}`);
    }
});

let allArticles = [];
let feedsProcessed = 0;
let currentSearchType = 'all';

document.getElementById('btn-levee').addEventListener('click', () => startSearch('levee'));
document.getElementById('btn-ma').addEventListener('click', () => startSearch('ma'));
document.getElementById('btn-all').addEventListener('click', () => startSearch('all'));

function startSearch(type) {
    currentSearchType = type;
    allArticles = [];
    feedsProcessed = 0;
    
    const timeFilter = document.getElementById('time-filter').value;
    const now = new Date();
    let limitDate = new Date(0);
    if (timeFilter !== 'all') {
        limitDate = new Date();
        limitDate.setDate(now.getDate() - parseInt(timeFilter));
    }
    
    const loadingDiv = document.getElementById('loading');
    const tbody = document.getElementById('results-body');
    
    loadingDiv.style.display = 'block';
    loadingDiv.textContent = `Exploration des opérations : 0 / ${feeds.length} requêtes...`;
    tbody.innerHTML = ''; 

    feeds.forEach((feed, index) => {
        setTimeout(() => {
            const script = document.createElement('script');
            const callbackName = 'processRSS_' + index;
            
            window[callbackName] = function(data) {
                feedsProcessed++;
                loadingDiv.textContent = `Exploration des opérations : ${feedsProcessed} / ${feeds.length} requêtes...`;

                if (data.status === 'ok') {
                    data.items.forEach(item => {
                        const articleDate = new Date(item.pubDate);
                        if (articleDate < limitDate) return; 

                        const titleLower = item.title.toLowerCase();
                        const descriptionLower = (item.description || "").toLowerCase();
                        const texteGlobal = titleLower + " " + descriptionLower;
                        
                        let isRelevant = false;

                        const regexLevee = /(lève|levée|fonds|financement|millions?|milliards?|série|investit|raises|funding|series|secures|amorçage|seed|capital|tour de table|clôture|backing|backed|grant|subvention|dette|crowdfunding|ipo|Papernest|Selectra)/;
                        const regexMA = /(rachète|acquisition|acquiert|fusion|rachat|partenariat|passent chez|acquires|merger|buys|merges|s'offre|rejoint|absorbe|takeover|stake|participation|alliance|associe|joint venture|buyout|spin-off|reprend|intégration)/;

                        // NOUVEAU COMPORTEMENT POUR "VOIR TOUT" : On cherche Levées OU M&A
                        if (currentSearchType === 'all' && (titleLower.match(regexLevee) || titleLower.match(regexMA))) {
                            isRelevant = true;
                        } else if (currentSearchType === 'levee' && titleLower.match(regexLevee)) {
                            isRelevant = true;
                        } else if (currentSearchType === 'ma' && titleLower.match(regexMA)) {
                            isRelevant = true;
                        }

                        if (isRelevant) {
                            if (titleLower.match(/(nouveau fonds|prépare un fonds|clôture un fonds|salon|coulisses|ipem|baromètre|succès de son fonds|bourse|cac 40|nomination|décès)/)) {
                                isRelevant = false;
                            }

                            // Le filtre "secteur strict" s'applique uniquement si on n'est PAS sur "Voir tout"
                            const isGeneraliste = feed.includes('maddyness') || feed.includes('techcrunch') || feed.includes('sifted') || feed.includes('lesechos');
                            const motsClefsEnergie = /(énergie|solaire|batterie|flexibilité|rénovation|climat|greentech|cleantech|climatetech|photovoltaïque|stockage d'énergie|transition énergétique|transition écologique|décarbonation|éolien|hydrogène|hydrogen|biogaz|biométhane|réseau électrique|\bgrid\b|efficacité énergétique|éco-mobilité|mobilité électrique|recharge|bornes|renouvelable|renewable|\bwind\b|nuclear|nucléaire|\bev\b|véhicule électrique|\bipp\b)/;
                            
                            if (currentSearchType !== 'all' && isGeneraliste && !texteGlobal.match(motsClefsEnergie)) {
                                isRelevant = false;
                            }
                        }

                        if (isRelevant) {
                            let montant = "-";
                            let entite = "";
                            let secteur = "Autre"; 

                            // Détection du secteur (toujours active pour la pastille)
                            if (texteGlobal.match(/(rénovation|isolation|pompes? à chaleur|\bpac\b|\bdpe\b|bâtiment|efficacité énergétique|thermique|passoire|cpe)/)) secteur = "Rénovation";
                            else if (texteGlobal.match(/(solaire|photovoltaïque|\bpv\b|panneaux?|agrivoltaïsme|solar|ensoleillement|onduleurs?)/)) secteur = "Solaire";
                            else if (texteGlobal.match(/(flexibilité|effacement|pilotage|smart grid|\bvpp\b|réseau électrique|\bgrid\b|agrégateur|gestion de l'énergie)/)) secteur = "Flexibilité";
                            else if (texteGlobal.match(/(batteries?|stockage|\bbess\b|lithium|battery|storage|gigafactory)/)) secteur = "Batterie";
                            else if (texteGlobal.match(/(énergie|energy|renouvelables?|renewables?|enr|cleantech|greentech|climatetech|éolien|\bwind\b|hydrogène|biométhane|biogaz|nucléaire|transition|décarbonation|\bipp\b|power)/)) secteur = "Énergie";

                            const regexMontant = /(\d+(?:[.,]\d+)?\s*(?:millions?|milliards?|M€|M\$|k€|K€|€|\$|M|B))/i;
                            const matchMontant = item.title.match(regexMontant);
                            if (matchMontant) montant = matchMontant[0];

                            const keywords = [' lève ', ' rachète ', ' acquiert ', ' annonce ', ' passent chez ', ' raises ', ' acquires ', ' secures ', " s'offre ", " s'associe ", ' rejoint ', ' fusionne ', ' associe ', ' investit ', ' clôture ', ' lance '];
                            for (let kw of keywords) {
                                let indexMot = titleLower.indexOf(kw);
                                if (indexMot > 0) {
                                    let texteAvant = item.title.substring(0, indexMot).trim();
                                    
                                    if (texteAvant.includes(':')) texteAvant = texteAvant.split(':').pop().trim();
                                    if (texteAvant.includes(',')) texteAvant = texteAvant.split(',')[0].trim(); 
                                    if (texteAvant.includes('-')) texteAvant = texteAvant.split('-').pop().trim(); 
                                    
                                    texteAvant = texteAvant.replace(/^(la|le|les|un|une)\s+(start-up|startup|fintech|société|pépite|entreprise|scale-up|groupe)\s+/ig, '').trim();
                                    texteAvant = texteAvant.replace(/^(la|le|les|un|une)\s+/ig, '').trim();
                                    
                                    let nombreDeMots = texteAvant.split(' ').length;
                                    if(texteAvant.length > 0 && nombreDeMots <= 4 && texteAvant.length < 35) {
                                        entite = texteAvant.charAt(0).toUpperCase() + texteAvant.slice(1);
                                    }
                                    break;
                                }
                            }

                            let doublon = allArticles.find(a => a.entite.toLowerCase() === entite.toLowerCase() && entite !== "");
                            
                            if (!doublon) {
                                let sourceName = 'Source';
                                if (feed.includes('pv-mag')) sourceName = 'PV Mag';
                                else if (feed.includes('energynews')) sourceName = 'EnergyNews';
                                else if (feed.includes('maddyness')) sourceName = 'Maddyness';
                                else if (feed.includes('greenunivers')) sourceName = 'GreenUnv.';
                                else if (feed.includes('techcrunch')) sourceName = 'TechCrunch';
                                else if (feed.includes('sifted')) sourceName = 'Sifted';
                                else if (feed.includes('lesechos')) sourceName = 'Les Echos';
                                else if (feed.includes('cleantechnica')) sourceName = 'CleanTech';
                                else if (feed.includes('transition')) sourceName = 'Transition En.';

                                allArticles.push({ 
                                    title: item.title, 
                                    link: item.link, 
                                    date: articleDate,
                                    source: sourceName,
                                    entite: entite,
                                    montant: montant,
                                    secteur: secteur 
                                });
                            }
                        }
                    });
                }
                checkIfDone();
            };

            script.onerror = function() { 
                feedsProcessed++; 
                checkIfDone(); 
            };
            
            script.src = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed)}&callback=${callbackName}`;
            document.body.appendChild(script);

        }, index * 100); 
    });
}

function checkIfDone() {
    if (feedsProcessed === feeds.length) displayResults();
}

function displayResults() {
    const loadingDiv = document.getElementById('loading');
    const tbody = document.getElementById('results-body');
    
    loadingDiv.style.display = 'none';
    allArticles.sort((a, b) => b.date - a.date);

    if (allArticles.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding: 30px;">Aucune opération trouvée avec ces filtres.</td></tr>`;
        return;
    }

    allArticles.forEach(article => {
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
    
    // On va chercher le fichier README.md à la racine du projet
    fetch('README.md')
        .then(response => {
            if(!response.ok) throw new Error("Fichier introuvable");
            return response.text();
        })
        .then(text => {
            // marked.parse() convertit le texte brut en HTML formaté
            document.getElementById('readme-content').innerHTML = marked.parse(text);
        })
        .catch(err => {
            document.getElementById('readme-content').innerHTML = "<p style='color:red;'>Erreur : Le fichier README.md n'a pas pu être chargé. Assurez-vous qu'il est présent sur le dépôt GitHub.</p>";
        });
});

// Fermeture de la modale au clic sur la croix ou en dehors de la fenêtre
spanClose.onclick = () => modal.style.display = 'none';
window.onclick = (event) => {
    if (event.target === modal) modal.style.display = 'none';
};
