
ChromeUtils.import("resource://gre/modules/Services.jsm");
ChromeUtils.import("resource://gre/modules/pacomeAuthUtils.jsm");

//Tableau global des liens externes
var gUrlsCourrielleur=new Array();
gUrlsCourrielleur["courrielleur.urlmelanissimo"]="https://melanissimo-ng.din.developpement-durable.gouv.fr";
gUrlsCourrielleur["courrielleur.infosmaj"]="http://numerique.metier.e2.rie.gouv.fr/courrielleur-mel-version-8-5-a1872.html";
gUrlsCourrielleur["courrielleur.aide"]="https://mel.din.developpement-durable.gouv.fr/aide";
gUrlsCourrielleur["courrielleur.notesversion"]="http://courrielleur.s2.m2.e2.rie.gouv.fr/changelog.html";
gUrlsCourrielleur["courrielleur.nouveautes"]="http://numerique.metier.e2.rie.gouv.fr/courrielleur-mel-version-8-5-a1872.html";
gUrlsCourrielleur["courrielleur.urlagenda"]="https://mel.din.developpement-durable.gouv.fr/";


//url de la fenetre d'ajout d'agenda de pacome
const CM2_PACOME_ADDCAL="chrome://pacome/content/pacomeaddcal.xul";


/*
*	Génération de traces
*/
var gCm2InitTrace=false;
var gCourrielleurConsole=null;

function CourrielleurTrace(msg){

  if (!gCm2InitTrace){   
    let t=Services.prefs.getBoolPref("courrielleur.trace");
    if (t)
      gCourrielleurConsole=Services.console;
    gCm2InitTrace=true;
  }
  if (gCourrielleurConsole)
    gCourrielleurConsole.logStringMessage("[Courrielleur] "+msg);
}



/*
*	Ouvre une url définie dans une préférence
*
*	@param urlpref préférence contenant l'url à ouvrir
*/
function Cm2OuvreUrlPref(urlpref){

  try{
    
    let url=Services.prefs.getCharPref(urlpref);

    if (null==url){
      CourrielleurTrace("Cm2OuvreUrlPref - preference non definie dans le profil:"+urlpref);
      return;
    }

    Cm2OuvreUrlExterne(url);
    
  } catch(ex){
    CourrielleurTrace("Cm2OuvreUrlPref - Erreur ouverture url externe "+urlpref+"."+ex);
  }
}


/*
*	Ouvre un lien externe
*
*	@param pref nom de la préférence qui contient l'url
*/
function Cm2OuvreLienPrefExterne(pref){

  try{
    
    //preference pour url spécifique
    let prefurl=Services.prefs.getCharPref(pref);
    if (prefurl && ""!=prefurl) 
      url=prefurl;

    Cm2OuvreUrlExterne(url);
    
  } catch(ex){
    CourrielleurTrace("Cm2OuvreUrlPref - Erreur ouverture lien externe "+pref+"."+ex);
  }
}



/*
*	Ouvre une url externe
*
*	@param url l'url à ouvrir
*/
function Cm2OuvreUrlExterne(url){

  try{
    
    CourrielleurTrace("Cm2OuvreUrlExterne url:"+url);
    let newuri=Services.io.newURI(url, null, null);
    let extproc=Components.classes["@mozilla.org/uriloader/external-protocol-service;1"].getService(Components.interfaces.nsIExternalProtocolService);
    extproc.loadURI(newuri, null);
    
  } catch(ex){
    CourrielleurTrace("Cm2OuvreUrlPref - Erreur ouverture lien externe "+pref+"."+ex);
  }
}


function Cm2GetUserMdpPrincipal(){

  let cp=PacomeAuthUtils.GetComptePrincipal();

  if (null==cp){
    return null;
  }

  var usermdp=new Array();
  usermdp["user"]=cp.incomingServer.username;
  usermdp["mdp"]=cp.incomingServer.password;

  return usermdp;
}




/* fonction experimentale courrrielleur v3
ouvre une url dans un onglet si prefmode est à true, sinon navigateur externe
prefmode :
agenda.webintab true|false
*/
function cm2OuvreAppliWeb(url, prefmode) {

  CourrielleurTrace("cm2OuvreAppliWeb url="+url+" - prefmode="+prefmode);

  if (null==prefmode) {
    Cm2OuvreUrlExterne(url);
    return;
  }

  let mode=Services.prefs.getBoolPref(prefmode);

  CourrielleurTrace("cm2OuvreAppliWeb valeur prefmode="+mode);

  if (!mode) {
    Cm2OuvreUrlExterne(url);
    return;
  }

  //https://developer.mozilla.org/en/Thunderbird/Content_Tabs
  let tabmail=document.getElementById("tabmail");
  if (!tabmail) {
    // Try opening new tabs in an existing 3pane window
    let mail3PaneWindow=Services.wm.getMostRecentWindow("mail:3pane");

    if (mail3PaneWindow) {
      tabmail=mail3PaneWindow.document.getElementById("tabmail");
      mail3PaneWindow.focus();
    }
  }

  if (!tabmail) {
    Cm2OuvreUrlExterne(url);
    return;
  }


  CourrielleurTrace("cm2OuvreAppliWeb ouverture url dans le courrielleur:"+url);

  tabmail.openTab("contentTab", {contentPage: url,
                                  clickHandler: "specialTabs.defaultClickHandler(event);"});
}

/* fonction experimentale ouverture Melanissimo dans thunderbird 3 */
function cm2OuvreMelanissimo(){

  //preference pour url spécifique
  let prefurl=Services.prefs.getCharPref('courrielleur.urlmelanissimo');
  if (prefurl && ""!=prefurl)
    url=prefurl;

  cm2OuvreAppliWeb(url, 'melanissimo.webint');
}

function cm2AideCourrielleur(){

  //preference pour url spécifique
  let prefurl=Services.prefs.getCharPref('courrielleur.aide');
  if (prefurl && ""!=prefurl)
    url=prefurl;

  cm2OuvreAppliWeb(url, 'courrielleur.webint');
}


function cm2PageAccueil() {

  let url=Services.prefs.getCharPref('mailnews.start_page.url');
  cm2OuvreAppliWeb(url, 'pageaccueil.webint');
}



function cm2PacomeAjoutAgenda(){

  window.openDialog(CM2_PACOME_ADDCAL,"","chrome,modal,centerscreen,titlebar,resizable=no");
}




function aproposCourrielleur(){
  window.openDialog("chrome://courrielleur/content/apropos.xul","","dialog,centerscreen,titlebar,modal");
}


/*
* cm2-tb31 - Bug mantis 0003495: TB31 : dysfonctionnements avec la préférence 'capability.policy.localfilelinks.sites'
* cm2ClearPolicy : supprime les preferences capability.policy.localfilelinks
*/
function cm2ClearPolicy(){

  let prefBranch=Services.prefs.getBranch("capability.policy.");

  if (!Services.prefs.prefHasUserValue("localfilelinks.sites")){
    CourrielleurTrace("cm2ClearPolicy pas de preference localfilelinks.sites");
    return;
  }

  //user_pref("capability.policy.localfilelinks.sites", "mailbox:// imap://amelie-01.ac.melanie2.i2:993 [^] ... etc.");
  Services.prefs.clearUserPref("localfilelinks.sites");

  let policynames=Services.prefs.getCharPref("policynames");
  CourrielleurTrace("cm2ClearPolicy capability.policy.policynames:"+policynames);
  if ("localfilelinks"==policynames) {
    Services.prefs.clearUserPref("policynames");
  } else {
    policynames=policynames.replace(/localfilelinks\ */, "");
    Services.prefs.setCharPref("policynames", policynames);
  }

  //user_pref("capability.policy.localfilelinks.checkloaduri.enabled", "allAccess");
  Services.prefs.clearUserPref("localfilelinks.checkloaduri.enabled");

  //forcer rechargement des comptes
  MailServices.accounts.UnloadAccounts();
  CourrielleurTrace("cm2ClearPolicy rechargement des comptes (nombre):"+MailServices.accounts.accounts.length);

  CourrielleurTrace("cm2ClearPolicy preferences localfilelinks effacees");
}


/**
* mantis 0004108: Nouveaux noms : ajouter dynamiquement les exceptions m2 pour les anciens courrielleurs
* exceptions ajoutees une seule fois
* .din.developpement-durable.gouv.fr
* .s2.m2.e2.rie.gouv.fr
*/
function cm2MajExceptions(){

  try {

    let maj=Services.prefs.getBoolPref("courrielleur.majexceptions");
    
    if (maj){
      //exceptions deja ajoutees
      return;
    }
    
    let except=Services.prefs.getCharPref("network.proxy.no_proxies_on");
    CourrielleurTrace("Mise a jour network.proxy.no_proxies_on (exceptions courrielleur)");
    
    if (null==except || ""==except){
      Services.prefs.setCharPref("network.proxy.no_proxies_on", ".din.developpement-durable.gouv.fr,.s2.m2.e2.rie.gouv.fr");
    } else {
      //.din.developpement-durable.gouv.fr
      let pos=except.indexOf(".din.developpement-durable.gouv.fr");
      if (-1==pos){
        except+=",.din.developpement-durable.gouv.fr";
      }
      //.s2.m2.e2.rie.gouv.fr
      pos=except.indexOf(".s2.m2.e2.rie.gouv.fr");
      if (-1==pos){
        except+=",.s2.m2.e2.rie.gouv.fr";
      }
      Services.prefs.setCharPref("network.proxy.no_proxies_on", except);
    }
    
    Services.prefs.setBoolPref("courrielleur.majexceptions", true);
    
  } catch(ex){
    CourrielleurTrace("Mise a jour network.proxy.no_proxies_on - erreur:"+ex);
  }
}

function cm2BoiteAIdees(){

  window.openDialog("chrome://courrielleur/content/cm2Idees.xul","","chrome,centerscreen,titlebar,modal,resizable");
}

