const fs = require('fs');
const Parser = require('rss-parser');
const parser = new Parser();

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

// Puisque le script tourne tous les jours, une profondeur de 3 pages est largement suffisante
// pour capter les nouveautés de la veille sans surcharger les serveurs.
const profondeur = 3; 
const feeds = [];

baseFeeds.forEach(url => {
    for (let i = 1; i <= profondeur; i++) {
        if (i === 1) feeds.push(url);
        else feeds.push(`${url}${url.includes('?') ? '&' : '?'}paged=${i}`);
    }
});

const DATA_FILE = 'data.json';
let allArticles = [];

// Chargement de l'historique existant pour ne rien perdre
if (fs.existsSync(DATA_FILE)) {
    const rawData = fs.readFileSync(DATA_FILE);
    allArticles = JSON.parse(rawData);
    console.log(`Historique chargé : ${allArticles.length} articles existants.`);
}

async function scrapeFeeds() {
    let nouveauxArticles = 0;

    for (const feedUrl of feeds) {
        try {
            console.log(`Analyse de : ${feedUrl}`);
            const feed = await parser.parseURL(feedUrl);
            
            feed.items.forEach(item => {
                const titleLower = item.title.toLowerCase();
                const descriptionLower = (item.contentSnippet || item.content || "").toLowerCase();
                const texteGlobal = titleLower + " " + descriptionLower;
                
                let isRelevant = false;

                const regexLevee = /(lève|levée|fonds|financement|millions?|milliards?|série|investit|raises|funding|series|secures|amorçage|seed|capital|tour de table|clôture|backing|backed|grant|subvention|dette|crowdfunding|ipo|papernest|selectra)/;
                const regexMA = /(rachète|acquisition|acquiert|fusion|rachat|partenariat|passent chez|acquires|merger|buys|merges|s'offre|rejoint|absorbe|takeover|stake|participation|alliance|associe|joint venture|buyout|spin-off|reprend|intégration)/;

                if (titleLower.match(regexLevee) || titleLower.match(regexMA)) {
                    isRelevant = true;
                }

                if (isRelevant) {
                    if (titleLower.match(/(nouveau fonds|prépare un fonds|clôture un fonds|salon|coulisses|ipem|baromètre|succès de son fonds|bourse|cac 40|nomination|décès)/)) {
                        isRelevant = false;
                    }

                    const isGeneraliste = feedUrl.includes('maddyness') || feedUrl.includes('techcrunch') || feedUrl.includes('sifted') || feedUrl.includes('lesechos');
                    const motsClefsEnergie = /(énergie|solaire|batterie|flexibilité|rénovation|climat|greentech|cleantech|climatetech|photovoltaïque|stockage d'énergie|transition énergétique|transition écologique|décarbonation|éolien|hydrogène|hydrogen|biogaz|biométhane|réseau électrique|\bgrid\b|efficacité énergétique|éco-mobilité|mobilité électrique|recharge|bornes|renouvelable|renewable|\bwind\b|nuclear|nucléaire|\bev\b|véhicule électrique|\bipp\b)/;
                    
                    if (isGeneraliste && !texteGlobal.match(motsClefsEnergie)) {
                        isRelevant = false;
                    }
                }

                if (isRelevant) {
                    let montant = "-";
                    let entite = "";
                    let secteur = "Autre"; 

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

                    let sourceName = 'Source';
                    if (feedUrl.includes('pv-mag')) sourceName = 'PV Mag';
                    else if (feedUrl.includes('energynews')) sourceName = 'EnergyNews';
                    else if (feedUrl.includes('maddyness')) sourceName = 'Maddyness';
                    else if (feedUrl.includes('greenunivers')) sourceName = 'GreenUnv.';
                    else if (feedUrl.includes('techcrunch')) sourceName = 'TechCrunch';
                    else if (feedUrl.includes('sifted')) sourceName = 'Sifted';
                    else if (feedUrl.includes('lesechos')) sourceName = 'Les Echos';
                    else if (feedUrl.includes('cleantechnica')) sourceName = 'CleanTech';
                    else if (feedUrl.includes('transition')) sourceName = 'Transition En.';

                    // Déduplication basée sur le lien de l'article pour être 100% précis
                    const isDuplicate = allArticles.some(a => a.link === item.link);
                    
                    if (!isDuplicate) {
                        allArticles.push({
                            title: item.title, 
                            link: item.link, 
                            date: new Date(item.pubDate).toISOString(),
                            source: sourceName,
                            entite: entite,
                            montant: montant,
                            secteur: secteur 
                        });
                        nouveauxArticles++;
                    }
                }
            });
        } catch (error) {
            console.error(`Erreur sur le flux ${feedUrl}:`, error.message);
        }
    }

    // Tri par date décroissante et sauvegarde
    allArticles.sort((a, b) => new Date(b.date) - new Date(a.date));
    fs.writeFileSync(DATA_FILE, JSON.stringify(allArticles, null, 2));
    console.log(`Mise à jour terminée. ${nouveauxArticles} nouveaux articles ajoutés.`);
}

scrapeFeeds();
