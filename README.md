Comment lancer l'application en local ?
$ npm install -g live-server

1 - Lancer le backend :
$ cd ./back
$ npm install
$ npm run run:dev

2 - Lancer le frontend :
$ cd ./front
$ npm install
$ live-server

Puis allez à l'adresse : http://127.0.0.1:8080/

Comment lancer tous les tests en local avec Jest ?
$ npm run test

Comment lancer un seul test ?
Installez jest-cli :

$npm i -g jest-cli@26.6.3
$jest src/__tests__/your_test_file.js

Comment voir la couverture de test ?
http://127.0.0.1:8080/coverage/lcov-report/

Comptes et utilisateurs :
Vous pouvez vous connecter en utilisant les comptes:

administrateur :
utilisateur : admin@test.tld 
mot de passe : admin
employé :
utilisateur : employee@test.tld
mot de passe : employee