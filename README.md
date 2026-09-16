# Radar Veille M&A et Levées de fonds

Cet outil a été conçu pour automatiser la veille concurrentielle et financière dans le secteur de la transition énergétique. Il permet d'agréger, de filtrer et d'extraire des informations (montants, entités, secteurs) à partir des principales sources d'actualités spécialisées et généralistes (9 sources différentes)

## Fonctionnement général

L'application est un outil front-end statique (HTML, CSS, JavaScript). Elle ne nécessite aucune base de données ni serveur backend complexe. Elle interroge directement les flux RSS publics des journaux ciblés, analyse le texte des articles en temps réel, et restitue les données sous forme de tableau de bord.

## Logique de filtrage et d'extraction

Le moteur de recherche n'utilise pas d'intelligence artificielle coûteuse ou lente, mais s'appuie sur un système avancé d'expressions régulières (Regex) et d'heuristiques :

*   **Filtres d'intention :** L'outil détecte le vocabulaire spécifique aux opérations financières (ex: amorçage, tour de table, IPO, acquisition, spin-off).
*   **Filtres sectoriels :** Pour les sources généralistes (comme Les Echos ou TechCrunch), l'article est ignoré s'il ne contient pas le lexique de la transition énergétique dans son titre ou son résumé (ex: smart grid, agrivoltaïsme, biométhane).
*   **Extraction des montants :** Une formule mathématique repère les structures chiffrées suivies de devises ou de multiples (M€, milliards, $).
*   **Extraction des entités :** L'algorithme repère les verbes d'action financiers et isole le sujet de la phrase, tout en nettoyant les préfixes inutiles.
*   **Déduplication :** Si plusieurs médias traitent de la même opération le même jour, l'outil fusionne les résultats pour ne garder qu'une seule ligne par entité.

## Limites de l'outil et faux positifs

Le moteur de recherche privilégie volontairement l'exhaustivité (le rappel) à la sélectivité stricte : un paramétrage trop restrictif risquerait d'ignorer des opérations stratégiques dont le vocabulaire diffère légèrement de la norme journalistique. 

En contrepartie de cette couverture large, certains articles captés peuvent s'avérer hors-sujet ou ne pas concerner directement une transaction financière unitaire. Dans ces situations, le système ne trouve pas de structure syntaxique exploitable et affiche un tiret `-` pour l'entité ou la mention `ND` pour le montant.

Enfin, le traitement reposant sur des règles heuristiques (Regex) plutôt que sur un modèle d'apprentissage profond, l'outil n'affiche pas une précision de 100 % : certains titres aux formulations atypiques peuvent ponctuellement empêcher l'extraction correcte du montant ou du nom de l'entreprise ciblée.

## Subtilités techniques et défis résolus

Plusieurs mécanismes spécifiques ont été codés pour assurer la stabilité et l'efficacité de l'outil :

### 1. Contournement du CORS (Technique JSONP)
Les navigateurs web bloquent nativement les requêtes (fetch) effectuées d'un domaine vers un autre pour des raisons de sécurité. Pour contourner ce blocage, particulièrement sévère sur les réseaux d'entreprise, l'outil utilise l'API publique rss2json via la technique du JSONP. Plutôt que de lire des données, le code injecte dynamiquement des balises script invisibles. Le navigateur autorise cette manipulation, permettant à la donnée de franchir le pare-feu.

### 2. Gestion du Rate Limiting (Throttling)
Pour remonter loin dans le temps, l'outil interroge plusieurs pages d'archives par source (jusqu'à 90 requêtes générées en un clic). Pour éviter d'être banni par les serveurs pour attaque par déni de service (DDoS), un mécanisme de throttling a été implémenté. Un délai artificiel de 100 millisecondes est imposé entre chaque requête réseau, lissant la charge serveur et garantissant 100% de taux de réussite.

### 3. Pagination des archives RSS
Par défaut, un flux RSS ne contient que les derniers articles publiés. Pour offrir un historique pertinent (ex: "Le mois dernier"), l'algorithme exploite la pagination native des architectures WordPress en générant dynamiquement les URLs des pages antérieures (suffixe ?paged=N).
