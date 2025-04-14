# Exemple d'API EcoleDirecte avec Node.js et Hono

## Description

Ce projet est un exemple d'implémentation d'une API REST pour interagir avec l'API EcoleDirecte. Il utilise Node.js avec TypeScript et le framework Hono pour créer une API légère et performante qui permet de :

- S'authentifier à EcoleDirecte (y compris la gestion automatique des QCM de sécurité)
- Récupérer le cahier de texte et les devoirs des élèves
- Gérer correctement les tokens et cookies nécessaires pour l'authentification

## Prérequis

- Node.js (v18 ou supérieur recommandé)
- pnpm (ou npm/yarn)

## Installation

1. Clonez ce dépôt
2. Installez les dépendances :
   ```bash
   pnpm install
   ```
3. Créez un fichier de configuration pour les QCM :
   ```bash
   cp src/config/qcm.exemple.ts src/config/qcm.ts
   ```
4. Modifiez le fichier `src/config/qcm.ts` pour ajouter vos réponses aux questions QCM. Vous pouvez vous baser sur le fichier exemple fourni (`qcm.exemple.ts`) qui contient déjà la structure nécessaire.

## Démarrage

Pour lancer le serveur en mode développement :

```bash
pnpm dev
```

Le serveur démarre sur http://localhost:3000

## Structure du projet

```
src/
├── config/           # Configuration de l'API
│   ├── constants.ts  # URLs et paramètres de l'API
│   ├── qcm.exemple.ts# Exemple de configuration des QCM
│   └── qcm.ts        # Configuration des QCM (à créer)
├── routes/           # Routes de l'API
│   └── ecoledirecte.ts # Routes pour interagir avec EcoleDirecte
├── services/         # Services métier
│   └── ecoledirecte.service.ts # Service d'interaction avec l'API EcoleDirecte
├── types/            # Définitions de types TypeScript
│   └── ecoleDirecte.ts # Types pour les requêtes/réponses EcoleDirecte
├── utils/            # Utilitaires
│   ├── auth.ts       # Gestion des en-têtes d'authentification
│   ├── base64.ts     # Encodage/décodage Base64
│   ├── cookies.ts    # Extraction et gestion des cookies
│   ├── qcm.ts        # Aide à la résolution des QCM
│   └── url.ts        # Construction des URLs d'API
└── index.ts          # Point d'entrée de l'application
```

## Fonctionnalités principales

### Authentification avec gestion automatique des QCM

L'API gère automatiquement :

- L'obtention du token GTK initial
- La tentative de connexion
- Si un QCM est requis :
  - Récupération du QCM
  - Recherche de la réponse dans la base de connaissances configurée
  - Envoi de la réponse au QCM
  - Nouvelle authentification avec les données du QCM

### Récupération du cahier de texte

L'API permet de :

- Récupérer l'ensemble des devoirs à faire
- Récupérer les devoirs pour une date spécifique

## Utilisation de l'API

### Authentification

```
POST /ecoledirecte/login
Content-Type: application/json

{
  "username": "votre_identifiant",
  "password": "votre_mot_de_passe"
}
```

Réponse :

```json
{
  "success": true,
  "token": "token_ecoledirecte",
  "accounts": [...],
  "autoQcmAnswered": true  // Si un QCM a été résolu automatiquement
}
```

### Récupération des devoirs

```
GET /ecoledirecte/assignments/{studentId}
Authorization: token_ecoledirecte
```

### Récupération des devoirs pour une date spécifique

```
GET /ecoledirecte/assignments/{studentId}/{date}
Authorization: token_ecoledirecte
```

## Configuration des QCM

Pour configurer les réponses aux QCM, créer un fichier `src/config/qcm.ts` en ajoutant les paires question/réponse. Un exemple est fourni dans `qcm.exemple.ts` :

```typescript
export const QCM_ANSWERS: QcmAnswersType = {
  "Quelle est votre année de naissance ?": "2006",
  "Quel est votre mois de naissance ?": "janvier",
  // Ajoutez vos réponses ici
};
```
