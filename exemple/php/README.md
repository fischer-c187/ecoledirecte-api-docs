# Exemple d'Authentification EcoleDirecte en PHP

## Aperçu

Ce script PHP démontre un flux d'authentification complet avec l'API EcoleDirecte, incluant la gestion de l'authentification à deux facteurs (QCM). Cette implémentation est entièrement fonctionnelle et gère tout le processus de connexion de manière interactive.

## Fonctionnalités

- Authentification à l'API EcoleDirecte
- Récupération et gestion du jeton GTK
- Gestion interactive de la double authentification (QCM)
- Flux de connexion complet avec jetons de sécurité

## Prérequis

- PHP 7.2+
- Extension cURL activée
- Accès en ligne de commande pour les réponses QCM interactives

## Utilisation

1. Modifiez les variables de configuration au début du script :

```php
$apiVersion = '4.79.0';
$username = 'votre_identifiant'; // Remplacez par votre identifiant EcoleDirecte
$password = 'votre_mot_de_passe'; // Remplacez par votre mot de passe EcoleDirecte
```

2. Exécutez le script depuis la ligne de commande :

```bash
php index.php
```

3. Si l'authentification à deux facteurs est demandée, le script affichera la question et les options, puis vous invitera à choisir une réponse de manière interactive.

## Remarques importantes

- Cet exemple ne couvre que le processus d'authentification
- Les réponses au QCM sont gérées de manière interactive via la ligne de commande
- Ne partagez jamais vos identifiants ou jetons
- La vérification SSL est désactivée à des fins de test uniquement, envisagez de l'activer pour une utilisation en production

## Questions QCM

Pour les comptes élèves, vous pourriez rencontrer ces questions de vérification :

- Année de naissance
- Mois de naissance
- Jour de naissance
- Nom de la classe
- Nom de famille du professeur principal

## Exemple de sortie

GTK récupéré : abc123def4...
Code de réponse : 250
Double authentification requise (QCM)
=== Questionnaire de vérification ===
Question : Quelle est votre année de naissance ?
Propositions :
2005
2006
2007
2008
Entrez le numéro de votre choix (1-4) :
