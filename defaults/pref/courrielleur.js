//mise a jour version de test
//pref("courrielleur.urlmaj", "https://majcm2.ida.melanie2.i2/majcm2.php?prd=%PRODUCT%&ver=%VERSION%&buildid=%BUILD_ID%&buildtarget=%BUILD_TARGET%&loc=%LOCALE%&channel=%CHANNEL%&os_version=%OS_VERSION%&distribution=%DISTRIBUTION%&distribution_version=%DISTRIBUTION_VERSION%&cm2=%CM2_VERSION%");
//mise a jour version de production
pref("courrielleur.urlmaj", "https://127.0.0.1/majcm2.php?prd=%PRODUCT%&ver=%VERSION%&buildid=%BUILD_ID%&buildtarget=%BUILD_TARGET%&loc=%LOCALE%&channel=%CHANNEL%&os_version=%OS_VERSION%&distribution=%DISTRIBUTION%&distribution_version=%DISTRIBUTION_VERSION%&cm2=%CM2_VERSION%");

//numéro de version du courrielleur
pref("courrielleur.version", "8.7.0");


pref("agenda.webint", false);
pref("courrielleur.webint", false);
pref("melanissimo.webint", false);
pref("pageaccueil.webint", true);


//preferences modules courrielleur (valeurs par defaut)
pref("courrielleur.console", false);
pref("courrielleur.trace", false);
pref("anais.anaismoz.trace", false);

pref("archibald.trace", false);
pref("commentaires.trace", false);
pref("courrielleur.mimeTypesRdf", false);

//#6794: Mettre à jour les noms des ministères dans la 8.6.5
// liste des ministères (libellés séparés par ';')
pref("courrielleur.listeministeres", "Ministère de l'Intérieur");
// autres libelles ministeres  pour ajout
pref("courrielleur.autresministeres", "");

//libelle maitrise d'ouvrage des boites a propos
pref("courrielleur.libouvrage", "SG/DNUM/SDCAST/BST Bureau des services transverses");
//libelle maitrise d'oeuvre des boites a propos
pref("courrielleur.liboeuvre", "SG/DNUM/SDCAST/BST Bureau des services transverses");

//url de l'option de menu notes de version
pref("courrielleur.notesversion", "http://courrielleur.s2.m2.e2.rie.gouv.fr/changelog.html");
//url de l'option de menu nouveautes
pref("courrielleur.nouveautes", "http://numerique.metier.e2.rie.gouv.fr/courrielleur-mel-version-8-5-a1872.html");

//url FAQ Informaticiens
pref("courrielleur.cm2lienfaq", "http://pne.metier.e2.rie.gouv.fr/faq-messagerie-r454.html");
//url Trucs et Astuces du site utilisateurs
pref("courrielleur.cm2lientrucs", "http://bureautique.metier.e2.rie.gouv.fr/trucs-et-astuces-r23.html");

//url aide courrielleur
pref("courrielleur.aide", "http://messagerie.dsic.minint.fr/");

//valeur de test du proxy AMANDE
//test sur la terminaison du nom du proxy (".i2" => "proxy1.i2" => AMANDE)
// ".i2" par defaut, ex: proxy1.i2
pref("courrielleur.proxy.amande", "(.e2.rie.gouv.fr|.i2)");

//url melanie2web
pref("courrielleur.urlagenda", "https://mceweb2.si.minint.fr/?_task=calendar");

//url melanissimo (bouton)
pref("courrielleur.urlmelanissimo", "https://melanissimo-ng.din.developpement-durable.gouv.fr");

//mantis 0004108: Nouveaux noms : ajouter dynamiquement les exceptions m2 pour les anciens courrielleurs
//si true n'effectue pas (deja fait)
pref("courrielleur.majexceptions", false);

// autocompactage (mantis 4350)
// service actif
pref("courrielleur.autocompact", true);
// execution en mode offline
pref("courrielleur.autocompact.offline", true);
// detecter tous les n jours
pref("courrielleur.autocompact.njours", 15);
// messages debug
pref("courrielleur.autocompact.debug", false);
// seuil pour compactage (Mo)
pref("courrielleur.autocompact.seuil", 500);


// mantis 4097 - delai en secondes
pref("courrielleur.delai.start", 2);

// mantis 5130 - delai (reel=> +2s)
pref("courrielleur.testimap.delai", 10);
// si false fonction inactive
pref("courrielleur.testimap.startup", false);
// 0005592: Ouverture de Discussion : Ne plus utiliser les WebApps
//#7414: Ouvrir le BNum à la place du MelWeb pour l'item Discussion
pref("courrielleur.url.discussion", "https://mel.din.developpement-durable.gouv.fr/?_task=discussion");

pref("melanissimo.module", false);
