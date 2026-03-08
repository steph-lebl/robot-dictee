#Static audio
Je veux augmenter la qualité de l'audio du tts de robot dictée. Les mots lus sont parfois difficile à comprendre. 

Je crois qu'on pourrait arriver à de meilleurs résultats en générant à l'avance les fichiers audio pour les dictées connues. Maintenant que robot dictée est hébergée sur firebase, on pourrait ajouter diffuser les fichiers audio via firebase et simplement faire jouer ces fichiers audio statique au bon moment dans robot dictée. 

Explique-moi à haut niveau ton plan pour y arriver.
Je veux qu'on valider l'approche ensemble avant de débuter la réalisation.

## Critères
- La dictée "Thème 1 - Semaine 1" dans predefinedDictatios.js utilise des fichiers audio générés en amont
- Génère les fichiers audio uniquement pour cette dictée pour l'instant
- Les fichiers audio générés en amont permettent de comprendre facilement les mots de la dictée
- Toutes les fonctionnalitées de robot dictée fonctionnent comment avant, mais les fichiers audio sont prégénérés plutôt que généré par le navigateur.
Par exemple, on peut faire répéter. Un mot erroné est affiché en rouge avec la correction en vert, etc. 