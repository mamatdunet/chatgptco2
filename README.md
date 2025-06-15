Calculateur CO₂ ChatGPT

Calculez l'empreinte carbone approximative de l'intégralité des conversations de votre compte ChatGPT en analysant votre historique de chat exporté

À tester sur : [https://chatgptco2.netlify.app/](url)


# 💨 ChatGPT CO₂ Calculator

Calculez l'empreinte carbone approximative de l'intégralité des conversations de votre compte ChatGPT en analysant votre historique de chat exporté.

## 🚀 Fonctionnalités

*   **Analyse détaillée** : Calcule le nombre total de mots, de tokens, les émissions de CO₂ et la consommation d'eau générés par les réponses de l'assistant ChatGPT.
*   **Équivalents environnementaux** : Convertit les émissions de CO₂ en équivalents concrets (kilomètres en voiture, entrecôtes, heures de streaming, kilomètres en avion, consommation électrique) pour une meilleure compréhension de l'impact.
*   **Personnalisation** : Permet d'ajuster le facteur d'émission de CO₂ par 1000 tokens pour affiner les calculs.
*   **Confidentialité** : Fonctionne entièrement côté client dans votre navigateur. Aucune donnée personnelle n'est téléchargée ou stockée en ligne.
*   **Interface intuitive** : Glissez-déposez simplement votre fichier `conversations.json` de votre export ChatGPT.

## 🛠️ Technologies Utilisées

* J'ai utilisé Bolt.new pour le créer (en conversant, pas en développant - l'IA s'en est chargée). Je n'ai aucune idée de ce que Bolt a utilisé. Voilà ce qu'il me dit côté briques techno : 

*   **React** : Bibliothèque JavaScript pour la construction de l'interface utilisateur.
*   **TypeScript** : Sur-ensemble de JavaScript qui ajoute le typage statique.
*   **Tailwind CSS** : Framework CSS utilitaire pour un stylisme rapide et réactif.
*   **Vite** : Outil de build rapide pour les projets web modernes.
*   **Lucide React** : Collection d'icônes open-source pour une interface visuellement agréable.

## 💡 Comment ça marche ?

Le calculateur analyse le fichier `conversations.json` exporté de votre compte ChatGPT. Il parcourt les messages de l'assistant, compte les mots, estime les tokens, puis applique des facteurs de conversion pour calculer les émissions de CO₂ et la consommation d'eau.

### Exporter vos données ChatGPT

Pour obtenir votre fichier `conversations.json`, suivez ces étapes :

1.  Connectez-vous à votre compte ChatGPT.
2.  Cliquez sur votre icône de profil en haut à droite (ou en bas à gauche selon l'interface).
3.  Allez dans "Paramètres" (Settings).
4.  Dans la fenêtre qui s'affiche, cliquez sur "Gestion des données" (Data Controls).
5.  Sous "Exporter les données" (Export Data), cliquez sur "Exporter" (Export).
6.  Confirmez l'exportation. Vous recevrez un e-mail avec un lien de téléchargement (valide 24h). [1, 2]
7.  Téléchargez le fichier ZIP et décompressez-le.
8.  Dans le dossier décompressé, trouvez le fichier `conversations.json`.

### Utilisation du calculateur sur la version en ligne :

1.  Accédez à l'application web : [https://chatgptco2.netlify.app/](url)
2.  Glissez-déposez le fichier `conversations.json` dans la zone dédiée, ou cliquez pour le sélectionner.
3.  Les résultats s'afficheront automatiquement, incluant les statistiques de vos conversations et les équivalents environnementaux.
4.  Vous pouvez ajuster le "Facteur d'émission" pour voir comment cela impacte les résultats.

## 🔒 Confidentialité

Le site est censé fonctionner entièrement dans votre navigateur. **Aucune de vos données personnelles n'est censée être téléchargée ni stockée en ligne.** Le code source est disponible publiquement dans ce repo Github pour audit.

## 🌐 Déploiement

Ce projet est déployé sur Netlify : [https://chatgptco2.netlify.app/](url)

À noter : ce calculateur ne prend en compte que les conversations textuelles de votre historique. Il ne mesure pas l'impact CO₂ des images ou vidéos générées avec ChatGPT.

À titre indicatif, une image générée représenterait environ 2g de CO₂ seloncette étude de fin 2024.
