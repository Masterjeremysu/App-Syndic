L'OS de la Résidence le Floréal. Transformez la gestion de votre copropriété en une expérience fluide, sécurisée et collaborative.

⚡️ La Révolution de la v2.0
Après 4 jours de "Deep Work" et de refonte architecturale.

🛡️ Sécurité & Gouvernance "Hardened"
On ne rigole plus avec les accès. Le système a été blindé pour garantir une étanchéité totale des données :

Protocoles Master : Homogénéisation complète des couches de sécurité.

Conseil Syndical 2.0 : Chaque membre possède désormais un rôle granulaire et des outils de pilotage spécifiques.

Interface Syndic "Sandboxed" : Le syndic dispose de son propre dashboard, volontairement restreint à des actions ultra-ciblées pour une transparence totale.

🗺️ Data Visualization & Navigation
Cartographie Interactive : Refonte visuelle de la carte (Leaflet) avec système de filtres multicouches.

Filtres Avancés : Navigation ultra-rapide dans les rapports et les archives. Trouvez ce que vous cherchez en 2 clics.

Accessibilité : FAQ disponible en mode "Public" (sans login) pour accompagner les nouveaux arrivants dès le premier jour.

💬 Le "Mur des Voisins" (Social Hub)
L'immense nouveauté de cette version. Un espace d'échange structuré pour éviter le chaos des messageries classiques :
| 📢 Officiel | 🤝 Entraide | 🏷️ Annonces |
| :--- | :--- | :--- |
| 📍 Quartier | 🎉 Évènements | 🛠️ Vie Copro |

🏗️ Architecture Technique
Extrait de code
graph TD
    A[Utilisateur] -->|Auth Supabase| B{CoproSync Core}
    B --> C[Mur des Voisins]
    B --> D[Gestion Incidents]
    B --> E[Cartographie Filtres]
    D --> F[Notifications Centralisées]
    F --> G[Boîte Mail Master]
Engine: HTML5 / CSS3 (Design System basé sur Syne & Instrument Sans).

Backend: Supabase Realtime Database & Auth.

Maps: Leaflet.js Engine.

Automation: Système de routage des notifications vers une boîte mail de concentration (Tour de Contrôle).

🛠 Installation pour les Devs
Bash
# Cloner le projet
git clone https://github.com/Masterjeremysu/App-Syndic.git

# Lancer en local
# Pas de build lourd, juste du pur JS moderne.
# N'oubliez pas de configurer vos variables Supabase dans app.js
🚩 Beta-test & Feedback
Le projet est en constante évolution. Si vous repérez un bug ou une incohérence dans l'UI :

Ouvrez une Issue sur ce repo.

Ou envoyez un signalement via la nouvelle Boîte Mail Centralisée.

<p align="center">


<b>Propulsé par la passion du code au service du 13-19 rue du Moucherotte.</b>


<sub>Sassenage, France.</sub>
</p>
