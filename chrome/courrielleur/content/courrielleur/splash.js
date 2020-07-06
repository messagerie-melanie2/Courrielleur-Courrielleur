
ChromeUtils.import("resource://gre/modules/Services.jsm");


function startCm2Splash() {
  
  let version=Services.prefs.getCharPref("courrielleur.version");
  document.getElementById("cmel-version").textContent="Version "+version;

  //preferences capability.policy.localfilelinks
  cm2ClearPolicy();

  //Mise a jour des certificats 
  cm2MajCertificats();
  
  //mantis 0004108: Nouveaux noms : ajouter dynamiquement les exceptions m2 pour les anciens courrielleurs
  cm2MajExceptions();
}


function quitCm2Splash(){

  window.close();
}
