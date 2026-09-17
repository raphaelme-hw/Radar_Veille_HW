# Radar M&A et Levées de fonds - Hello Watt

Cet outil interne automatisé permet d'effectuer une veille quotidienne sur les opérations financières (fusions, acquisitions, levées de fonds) dans les secteurs de la transition énergétique, des cleantech et des greentech.

## Architecture Technique (100% Serverless)

L'outil repose sur une architecture moderne, gratuite et sans base de données tierce, hébergée intégralement sur l'écosystème GitHub.

* **Le Moteur (GitHub Actions) :** Chaque matin à 6h00 (heure de Paris), un robot virtuel s'allume automatiquement. Il exécute un script Node.js (`scraper.js`) qui parcourt les flux RSS d'une dizaine de médias spécialisés, déjoue les sécurités basiques, et extrait les nouveaux articles.
* **La Base de Données (Flat-file JSON) :** Le robot consolide les nouvelles découvertes avec l'historique existant, élimine les doublons, et sauvegarde le tout dans un fichier `data.json` situé à la racine du projet. L'historique des opérations est ainsi infini et cumulatif.
* **L'Interface (GitHub Pages) :** L'application front-end lit instantanément le fichier `data.json`. Aucun appel externe vers des API tierces n'est réalisé par le navigateur de l'utilisateur, garantissant un affichage en moins d'une seconde, sans risque de blocage ou de limitation de requêtes.

## Accès et Sécurité

Bien que l'hébergement du code soit géré par GitHub Pages, l'accès à l'interface est protégé par une barrière de courtoisie (mot de passe front-end). 
Cette protection légère empêche l'indexation par les moteurs de recherche et bloque les visiteurs non autorisés, bien que le code source reste techniquement auditable.

## Limites de l'outil et faux positifs

Le moteur de recherche privilégie volontairement l'exhaustivité (le rappel) à la sélectivité stricte : un paramétrage trop restrictif risquerait d'ignorer des opérations stratégiques dont le vocabulaire diffère légèrement de la norme journalistique. 

En contrepartie de cette couverture large, certains articles captés peuvent s'avérer hors-sujet ou ne pas concerner directement une transaction financière unitaire. Dans ces situations, le système ne trouve pas de structure syntaxique exploitable et affiche un tiret `-` pour l'entité ou la mention `ND` pour le montant.

Enfin, le traitement reposant sur des règles heuristiques (Expressions Régulières / Regex) plutôt que sur un modèle d'Intelligence Artificielle de type LLM, l'outil n'affiche pas une précision de 100 % : certains titres aux formulations atypiques peuvent ponctuellement empêcher l'extraction correcte du montant ou du nom de l'entreprise ciblée.

## Maintenance et Ajout de sources

Pour ajouter ou modifier un média source :
1. Éditer le fichier `scraper.js`.
2. Ajouter l'URL valide du flux RSS dans le tableau `baseFeeds`.
3. S'assurer que le média ne bloque pas les requêtes automatisées via des pares-feux de type Cloudflare ou Datadome (auquel cas l'erreur sera visible dans les logs de GitHub Actions).
