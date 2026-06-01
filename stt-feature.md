Je veux ajouter un mode "Épeler les mots - Reconnaissance vocale IOS". 

Dans un premier temps, on peut activer cette fonctionnalité en ajouter &stt dans l'url. Lorsqu'il y a le query string stt, alors robot dictée devient en mode "Épeler les mots - Reconnaissance vocale IOS" et cela est affiché dans la barre de titre en tout temps par la suite. Le seul moyen de sortir du mode est de recharger l'application sans le query string stt.

Lorsqu'on est en mode "Épeler les mots - Reconnaissance vocale IOS", Les lettres écrite par la reconnaissance vocale IOS, sont rendu compatible avec robot dictée.
## Exemples (expected / dictée vocale IOS)

### Général
1. amour / A. M. O. U. R.  
2. soie / S. O. I E.
3. soin / S. O. I N.
4. son / S. O. N.
5. spectacle / S. P. E. C. T. A. C. L. E.
6. sucre / S. U. C. R. E.
7. surface / S. U. R. F. A. C. E.
### Voyelle sans points
Parfois, il n'y a pas de points lorsqu'il y a deux voyelles consécutives. Parfois les deux voyelles sont collées, parfois non. 
1. secouer / S. E. C. O U. E. R.
2. soulier / S. OU L. I. E. R.
3. souriant / S. OU R. I A. N. T.
### Enjeu des accents
Énormément de variation avec les accents. Considérer faire un cas spécial lorsqu'il y a un accent à cet emplacement dans le mot attendu et être très tolérant sur l'input qui suit. Par exemple, si la lettre est bonne ignorer le reste et mettre le bon accent. Dans le cas du ç, il est carrément impossible de le dire.

1. présent / P. R. E. Accent aiguë S. E. N. T.
2. bébé / B. E. Accent aigu B E. Accent aigu / B. E. Accent aigu BE Accent aigu / B. E. Accent aiguë BE Accent aiguë / B. E. Accent aiguë BE accent aiguë / B. E. Accent aigu BE Accent aiguë
3. généreux / G. E. Accent aiguë, NE accent aiguë REU X. / G. Accent aiguë, N E. Accent aigu RE U. X.
   
4. sèche / S. È. C. H. E.
5. très / T. R. E. Grave S. / T. R. È, S.
6. où / O. U. Accent grave.
7. mère / M. È, R. E.
   
8. sûr / S. U. Accent circonflexe R.
9. hôpital / H.O accent circonflexe, P. I. T. A. L. / H.O accent complexe, P I.T A. L.
10. flûte / F. L. U. Accent complexe T E. / F. L. U. X. Complexe T E.
11. noël / N. O. E tréma L.
    
12. leçon / L. E. C. O N.
## Enjeux 
1. Il y a un petit délai entre le moment où IOS montre les lettres à l'utilisateurs et le mot final. Parfois, il réécrit pour le mieux quelques milisecondes plus tard. Surtout avec les accents.
2. Le feedback loop pour les tests est lent, car essentiellement, je dois essayer l'app sur mon cellulaire avec le speec to text de ios pour voir si ça fonctionne bien ou non. Très difficile d'automatiser les tests, et même difficile de tester à partir du dev container dans lequel on est actuellement.


