/*
* Courrielleur Mel - composant pour l'affichage de l'ecran de demarrage
*
*/

ChromeUtils.import("resource://gre/modules/Services.jsm");
ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");
ChromeUtils.import("resource://gre/modules/Timer.jsm");
ChromeUtils.import("resource://gre/modules/cm2MigreAmelie.jsm");
ChromeUtils.import("resource:///modules/folderUtils.jsm");

let Cc=Components.classes;
let Ci=Components.interfaces;


var gCm2StartupEvent=[
  "xpcom-shutdown",
  "mail-startup-done",
  "toplevel-window-ready",
  "command-line-startup",
  "profile-do-change",
  "final-ui-startup"
];

function Cm2Startup() {

  Services.console.logStringMessage("Cm2Startup");

  let startTime=Services.startup.getStartupInfo().process.getTime();
  Services.prefs.setIntPref("courrielleur.startlog", 0);
  Services.prefs.setCharPref("courrielleur.startTime", startTime);
  Services.prefs.setIntPref("mail.identity.timestamp_envoi_differe", 0);

  this.init();
}

Cm2Startup.prototype = {

  //fenetre de lancement
  splash:null,
  //true si splash peut etre fermee
  canclose:false,
  //si true application lancee en mode standard (mail:3pane)
  mail3pane:true,

  init: function cm2_init() {
    //Services.console.logStringMessage("*** Cm2Startup init");

    this.splash=Services.ww.openWindow(null, "chrome://courrielleur/content/splash.xul", "cm2splash",
                                      "chrome,dialog,titlebar=no",null);
                                          
	if (null!=this.splash){
		this.splash.moveTo(this.splash.screen.width, this.splash.screen.height);
	}
	
    this.canclose=true;

    for (var m in gCm2StartupEvent){
      Services.obs.addObserver(this, gCm2StartupEvent[m], false);
    }
  },

  dispose: function cm2_dispose() {
    //Services.console.logStringMessage("*** Cm2Startup dispose");

    for (var m in gCm2StartupEvent){
      Services.obs.removeObserver(this, gCm2StartupEvent[m]);
    }
  },

  observe: function(aSubject, aTopic, aData)
  {
    //Services.console.logStringMessage("*** Cm2Startup observe aSubject:"+aSubject+" - aTopic:"+aTopic+" - aData:"+aData+"\n");

    if ("app-startup"==aTopic){
      //creation resource calendar
      try {

        var resProt=Services.io.getProtocolHandler("resource").QueryInterface(Components.interfaces.nsIResProtocolHandler);
        var uri=resProt.getSubstitution("gre");
        
        if (!resProt.hasSubstitution("calendar", uri)){
          resProt.setSubstitution("calendar", uri);
          dump("Courrielleur resource calendar creee:"+uri.spec+"\n");
        }
        
        if (!resProt.hasSubstitution("webapptabs", uri)){
          resProt.setSubstitution("webapptabs", uri);
          dump("Courrielleur resource webapptabs creee:"+uri.spec+"\n");
        }
        
        if (!resProt.hasSubstitution("tbsortfolders", uri)){
          resProt.setSubstitution("tbsortfolders", uri);
          dump("Courrielleur resource tbsortfolders creee:"+uri.spec+"\n");
        }

      } catch(ex){
        dump("Courrielleur exception lors de la creation de la resource:"+ex+"\n");
      }

    } else if ("xpcom-shutdown"==aTopic){

      this.dispose();

    } else if ("toplevel-window-ready"==aTopic &&
                !this.mail3pane){

      if (this.canclose)
        this.fermeSplash();

    }
    else if ("mail-startup-done"==aTopic &&
              this.mail3pane){

      if (this.canclose)
        this.fermeSplash();

    } else if ("command-line-startup"==aTopic){

      var cmdLine=aSubject.QueryInterface(Ci.nsICommandLine);
      if (cmdLine) {
        //Services.console.logStringMessage("*** Cm2Startup nsICommandLine length:"+cmdLine.length);

        var accs=Services.prefs.getCharPref("mail.accountmanager.accounts");
        if (null==accs || ""==accs){
          this.mail3pane=false;
          Services.console.logStringMessage("Cm2Startup command-line-startup mail3pane=false aucun compte");
          return;
        }

        for (var i=0; i<cmdLine.length; i++){
          var arg=cmdLine.getArgument(i);
          //Services.console.logStringMessage("*** Cm2Startup nsICommandLine getArgument:"+arg);
          arg=arg.toLowerCase();
          if ("-jsconsole"==arg ||
              "-mail"==arg ||
              "-setdefaultmail"==arg) {
            continue;
          }
          this.mail3pane=false;
          Services.console.logStringMessage("Cm2Startup command-line-startup mail3pane=false argument:"+arg);
          break;
        }
      }

      let modif=modifyOrdreComptes();
      if (modif){
        Services.startup.quit(Services.startup.eForceQuit | Services.startup.eRestart);
      }
    }

    else if ("profile-do-change"==aTopic){

      cm2AmMigreComptes();
    } 

    else if ("final-ui-startup"==aTopic){
      //Services.console.logStringMessage("Cm2Startup final-ui-startup");
      this.migreUI();    
    }
  },
  
  migreUI: function(){
    
    // reinitialise (1 seule fois) la barre des boutons de la fenêtre message
    let version=0;
    if (Services.prefs.prefHasUserValue("courrielleur.migreui")){
      let val=Services.prefs.getCharPref("courrielleur.migreui");
      val=Number.parseFloat(val);
      if (!Number.isNaN(val)) {
        if (7.2<=val){
          version=7.2;
        }
      }               
    }
    if (0==version){
      let xulStore=Cc["@mozilla.org/xul/xulstore;1"].getService(Ci.nsIXULStore);
      if (xulStore.hasValue("chrome://messenger/content/messenger.xul", "header-view-toolbar", "currentset")) {
        xulStore.removeValue("chrome://messenger/content/messenger.xul", "header-view-toolbar", "currentset");
      }
      
      Services.prefs.setCharPref("courrielleur.migreui", "7.2");
    }
  },

  fermeSplash: function(){

    if (null==this.splash)
      return;
    //Services.console.logStringMessage("Cm2Startup fermeture de la fenetre de lancement");

    // temps de demarrage
    let cm2start=Services.prefs.getCharPref("courrielleur.startTime");
    let totalTime=Math.round((Date.now()-cm2start)/1000);
    Services.prefs.setIntPref("courrielleur.totalTime", totalTime);    

    let _this=this;
    function closeSplash() {
      if (_this.splash)
        _this.splash.close();
      _this.splash=null;
    }

    setTimeout(closeSplash, 2000);

    this.canclose=false;
  },

  // for XPCOM
  classID: Components.ID("{9FCAF8A0-BFB0-405d-AAF4-18F1D6E0E371}"),

  QueryInterface: XPCOMUtils.generateQI([Ci.nsIObserver])
}

// modification de l'ordre des comptes pour permettre le tri des comptes dans tbsortfolders
// réalisé une seule fois
// annule la modification pour le ticket mantis 0004268 a pour effet de changer l'ordre des comptes
// retourné par la fonction allAccountsSorted (folderUtils.jsm)
// modifyOrdreComptes modifie la préférence "mail.accountmanager.accounts"
// pour obtenir l'équivalent de allAccountsSorted en version originale
// return true si modification
function modifyOrdreComptes(){

	// tester si déjà fait
	let val=Services.prefs.getBoolPref("courrielleur.ordre_comptes", false);
	if (val) return false;

	// liste des comptes non triée
	let accounts1=allAccountsSorted();
	let ordre1=[];
	for (let acct of accounts1)
    ordre1.push(acct.key);
  let pref1=ordre1.join(",");
	Services.console.logStringMessage("modifyOrdreComptes pref1:"+pref1);

	// liste des comptes triée (tb original)
	let accounts2=accounts1.sort(compareAccounts);
	let ordre2=[];
	for (let acct of accounts2)
    ordre2.push(acct.key);
  let pref2=ordre2.join(",");
	Services.console.logStringMessage("modifyOrdreComptes pref2:"+pref2);

	if (pref1===pref2) return false;

	Services.console.logStringMessage("Modification de l'ordre des comptes au démarrage :"+pref2);

	Services.prefs.setCharPref("mail.accountmanager.accounts", pref2);
	Services.prefs.setBoolPref("courrielleur.ordre_comptes", true);

	Services.prefs.savePrefFile(null);

	return true;
}


var components = [Cm2Startup];
const NSGetFactory = XPCOMUtils.generateNSGetFactory(components);
