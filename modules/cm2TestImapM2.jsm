/*
* Mantis 0005130: Passage en mode hors ligne lors du lancement si le serveur imap n'est pas joignable
*/


ChromeUtils.import("resource://gre/modules/Services.jsm");
ChromeUtils.import("resource:///modules/mailServices.js");
ChromeUtils.import("resource:///modules/gloda/log4moz.js");
ChromeUtils.import("resource://gre/modules/Timer.jsm");
ChromeUtils.import("resource://gre/modules/pacomeAuthUtils.jsm");


const EXPORTED_SYMBOLS = ["cm2TestImapM2"];


const SERVEUR_IMAP_M2="amelie.s2.m2.e2.rie.gouv.fr";
//const SERVEUR_IMAP_M2="127.0.0.1";
const IMAP_M2_PORT=993;
const IMAP_M2_SSL=3;
const TIMEOUT_M2=1;// pour valeur réelle => +2

// ChromeUtils.import("resource:///modules/cm2TestImapM2.jsm");cm2TestImapM2();



// fonction de rappel pour notification de fin (optionnel)
function cm2TestImapM2(rappel){

  Services.console.logStringMessage("[cm2TestImapM2] Test du serveur de messagerie");

  if (Services.io.offline){
    
    Services.console.logStringMessage("[cm2TestImapM2] Client hors-ligne");
    
    if (rappel) 
      rappel();
    return;
  }

  // fonctionnalité active et timeout
  let delai=Services.prefs.getIntPref("courrielleur.testimap.delai");
  let nom=SERVEUR_IMAP_M2;
  let port=IMAP_M2_PORT;
  let ssl=IMAP_M2_SSL;

  try{

    if (null!=MailServices.accounts.defaultAccount &&
        null!=MailServices.accounts.defaultAccount.incomingServer) {

      let serveur=MailServices.accounts.defaultAccount.incomingServer;
      
      if (MSG_MELANIE2==PacomeAuthUtils.TestServeurMelanie2(serveur.hostName)){
        
        nom=serveur.hostName;
        port=serveur.port;
        ssl=serveur.socketType;
        
      } else
        Services.console.logStringMessage("[cm2TestImapM2] Le compte par défaut n'est pas melanie2");

    } else
      Services.console.logStringMessage("[cm2TestImapM2] Pas ce compte par défaut");

  } catch(ex){
    Services.console.logStringMessage("[cm2TestImapM2] Pas ce compte par défaut");
  }

  cm2ChargeAutresScript();

  let hoteImap={};

  let logger=Log4Moz.getConfiguredLogger("courrielleurM2");

  let socketErreur;

  let termine=false;

  let socketAbortable=SocketUtil(nom, port, 3,
              "1 CAPABILITY\r\n",
              delai,
              new SSLErrorHandler(hoteImap, logger),
              function(wiredata) // result callback
              {
                if (termine)
                  return;
                termine=true;

                if (socketAbortable){
                  socketAbortable.cancel(new CancelOthersException());
                }
                
                if (socketErreur){
                  if (!Services.io.offline)
                    Services.io.offline=true;
                  if (rappel) 
                    rappel();
                  return;
                }
                
                if (null==wiredata || undefined==wiredata.length){
                  Services.io.offline=true;
                  Services.console.logStringMessage("[cm2TestImapM2] Passage en mode hors-ligne (pas de reponse ou pas d'informations)");
                  if (rappel) 
                    rappel();
                  return;
                }
                
                let reponse=wiredata.join("");
                if (0!=reponse.indexOf("* OK ") &&
                    0!=reponse.indexOf("+OK ")){
                  Services.io.offline=true;
                  Services.console.logStringMessage("[cm2TestImapM2] Passage en mode hors-ligne (reponse != attendu");
                  if (rappel) 
                    rappel();
                  return;
                }
               
                Services.console.logStringMessage("[cm2TestImapM2] le serveur a repondu");
                if (rappel) 
                  rappel();
                return;
              },
              
              function(erreur) // error callback
              {
                if (termine)
                  return;
                termine=true;
                
                Services.io.offline=true;
                Services.console.logStringMessage("[cm2TestImapM2] Passage en mode hors-ligne (erreur):"+erreur);
                socketErreur=erreur;
                if (rappel) 
                  rappel();
                return;
              });
}

// chargement des scripts thunderbird
function cm2ChargeAutresScript(){

  let scloader=Services.scriptloader;
  
  scloader.loadSubScript("chrome://messenger/content/accountcreation/util.js");
  scloader.loadSubScript("chrome://messenger/content/accountcreation/fetchhttp.js");
  scloader.loadSubScript("chrome://messenger/content/accountcreation/guessConfig.js");
  scloader.loadSubScript("chrome://messenger/content/accountcreation/MyBadCertHandler.js");
}
