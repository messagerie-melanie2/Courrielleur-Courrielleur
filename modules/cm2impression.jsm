/**
* mantis 0004068: choix d'imprimer ou non les destinataires des messages
*/

const EXPORTED_SYMBOLS=["cm2printGetShowHeaders", "cm2printSetShowHeaders"];

ChromeUtils.import("resource://gre/modules/Services.jsm");

//valeur show_headers pour les impression (duree session)
var gCm2printShowHeaders=null;

/**
* Retourne la valeur d'impression d'entetes en cours (par defaut/session ou permanent)
*/
function cm2printGetShowHeaders(){
  
  if (null!=gCm2printShowHeaders){
    // Services.console.logStringMessage("*** cm2impression.jsm cm2printGetShowHeaders valeur en cours:"+gCm2printShowHeaders);
    return gCm2printShowHeaders;
  }
  
  gCm2printShowHeaders=Services.prefs.getIntPref("mail.show_headers");
  
  if (Services.prefs.prefHasUserValue("courrielleur.impression.show_headers")){
    //prendre valeur memorisee (permanente)
    // Services.console.logStringMessage("*** cm2impression.jsm cm2printGetShowHeaders prendre valeur memorisee");
    gCm2printShowHeaders=Services.prefs.getIntPref("courrielleur.impression.show_headers");
  }
  
  // Services.console.logStringMessage("*** cm2impression.jsm cm2printGetShowHeaders:"+gCm2printShowHeaders);
  return gCm2printShowHeaders;
}

/**
* Fixe la valeur d'impression d'entetes en cours
* si permanent a true => memorise dans la preference 'courrielleur.impression.show_headers'
*/
function cm2printSetShowHeaders(show_headers, permanent){
  
  gCm2printShowHeaders=show_headers;
  
  if (permanent){
    
    //memoriser la valeur dans la preference
    // Services.console.logStringMessage("*** cm2impression.jsm cm2printSetShowHeaders memoriser la valeur");
    Services.prefs.setIntPref("courrielleur.impression.show_headers", show_headers);
    
  } else{
    
    if (Services.prefs.prefHasUserValue("courrielleur.impression.show_headers")){
      // Services.console.logStringMessage("*** cm2impression.jsm cm2printSetShowHeaders effacer la valeur memorisee");
      Services.prefs.clearUserPref("courrielleur.impression.show_headers"); 
    }      
  }
  
  Services.prefs.savePrefFile(null);
}
