ChromeUtils.import("resource://gre/modules/Services.jsm");

window.addEventListener("load",initCourM2Messenger,false);

/**
*  appelée au démarrage de Thunderbird
*
*/
function initCourM2Messenger(){

  cm2InitBoutonsOnglet();
  
  gCm2MaintenanceIdle.Init();
}


/* Gére la détection du compactage automatique (mantis 4350)
  la mise à jour des adresses collectées ()
  le tout en tâche de fond (client inactif)
*/
// delai d'inactivite (s)
const CM2_DELAI_IDLE=180;

const SEUIL_TB=2000;


var gCm2MaintenanceIdle={
  
  Init: function(){
    
    // detection compactage (mantis 4350)
    this.compactage=this.canDoIt("autocompact");
    if (this.compactage &&
        !Services.prefs.prefHasUserValue("courrielleur.autocompact.dernier")){
      // modifier mail.purge_threshhold_mb;20=>SEUIL_TB (1 seule fois)
      Services.prefs.setIntPref("mail.purge_threshhold_mb", SEUIL_TB);
      Services.console.logStringMessage("Modification de mail.purge_threshhold_mb => : "+SEUIL_TB);
    }
    
    // mise à jour adresses ?
    this.majadr=this.canDoIt("majadrcol");
    
    // installation idle
    if (this.majadr || this.compactage){
      
      let msg="Installation du service silencieux pour ";
      if (this.majadr){
        if (this.compactage){
          msg+="mise à jour des adresses et compactage automatique";
        } else {
          msg+="mise à jour des adresses";          
        }
      } else if (this.compactage){
        msg+="compactage automatique";
      }
      Services.console.logStringMessage(msg);
      
      let idleService=Components.classes["@mozilla.org/widget/idleservice;1"]
                            .getService(Components.interfaces.nsIIdleService);
      idleService.addIdleObserver(this, CM2_DELAI_IDLE);
    }
  },
  
  // teste les preferences pour determiner si l'on doit réaliser
  // module : autocompact ou majadrcol
  canDoIt: function(module){
    
    let prefix="courrielleur."+module;
    let install=Services.prefs.getBoolPref(prefix);
    if (install){    
      let njours=Services.prefs.getIntPref(prefix+".njours");
      let dernier=0;
      if (Services.prefs.prefHasUserValue(prefix+".dernier")){
        dernier=Services.prefs.getIntPref(prefix+".dernier");
      }
      if (1<dernier){
        let t1=Date.now()/1000;
        let nb=Math.round((t1-dernier)/86400);
        if (nb<njours){
          install=false;
        }
      } 
    }
    
    return install;
  },
  
  // si true => mise à jour des adresses collectées
  majadr:false,
  // si true => détection du compactage
  compactage:false,
  
  // si true, opération en cours (evite prise en compte idle)
  encours: false,
  
  observe: function(subject, topic, data) {
    
    if ("idle"==topic && !this.encours){
      
      // majadr en premier si actif
      if (this.majadr){
        
        if (Services.io.offline){
          // pas de mise a jour
          // plus dans la session
          this.majadr=false;
          
        } else {
          
          this.encours=true;
          ChromeUtils.import("resource://gre/modules/cm2MajAdrCol.jsm");
          cm2MajAdrColSilent(cm2MajAdrColRetour);

        }        
      } 

      if (!this.majadr && this.compactage){
        
        this.encours=true;
        ChromeUtils.import("resource://gre/modules/cm2autocompact.jsm");
        Cm2AutoCompactage();
      
        // plus dans la session
        this.compactage=false;
      }
                
      // si plus rien a gérer => désinstaller
      if (!this.majadr && !this.compactage){
        let idleService=Components.classes["@mozilla.org/widget/idleservice;1"]
                                .getService(Components.interfaces.nsIIdleService);
        idleService.removeIdleObserver(this, CM2_DELAI_IDLE);
      }
    }
  }
}

function cm2MajAdrColRetour(){
  
  gCm2MaintenanceIdle.majadr=false;
  gCm2MaintenanceIdle.encours=false;
  
  let dernier=Date.now()/1000;
  Services.prefs.setIntPref("courrielleur.majadrcol.dernier", dernier);
}


/* bug mantis 0002594: Affichage du carnet d'addresse dans un onglet du courrielleur
  bug mantis 0002593: Affichage de l'annuaire dans un onglet du courrielleur
*/
function cm2InitBoutonsOnglet() {

  let bundle=Services.strings.createBundle("chrome://courrielleur/locale/courrielleur.properties");

  let bar=document.getElementById("tabbar-toolbar");
  
  // #6367: Erreur console au lancement bar is null
  if(bar)
  {
    let bt1=document.createElement("toolbarbutton");
    bt1.setAttribute("id", "cm2-tab-abook");
    bt1.setAttribute("class", "toolbarbutton-1");
    bt1.setAttribute("oncommand", "OuvreEnOnglet('chrome://messenger/content/addressbook/addressbook.xul', 'cm2-tab-abook');");
    bt1.setAttribute("tooltiptext", bundle.GetStringFromName("cm2tab.abook.label"));

    bar.appendChild(bt1, null);

    let bt2=document.createElement("toolbarbutton");
    bt2.setAttribute("id", "cm2-tab-anais");
    bt2.setAttribute("class", "toolbarbutton-1");
    bt2.setAttribute("oncommand", "OuvreEnOnglet('chrome://anais/content/anaismozdlg.xul', 'cm2-tab-anais');");
    bt2.setAttribute("tooltiptext", bundle.GetStringFromName("cm2tab.anais.label"));

    bar.appendChild(bt2, null);
  }
}

function OuvreEnOnglet(chromeurl, typeonglet) {

  if (null==chromeurl || ""==chromeurl)
    return;

  if ("cm2-tab-anais"==typeonglet &&
      Services.io.offline){
    let bundle=Services.strings.createBundle("chrome://anais/locale/anais.properties");
    let msg=bundle.GetStringFromName("anaisdlg_ErrDeconnecte");
    Services.prompt.alert(window, "", msg);
    return;
  }    

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
    window.openDialog(chromeurl,
                      "",
                      "chrome,center,resizable,titlebar,dialog=no");
    return;
  }

  //chromeTab
  let tab=tabmail.openTab("chromeTab", {chromePage: chromeurl,
                                  clickHandler: "specialTabs.defaultClickHandler(event);"});
  if (null!=tab && null!=typeonglet) {
    let cl=tab.tabNode.getAttribute("class");
    tab.tabNode.setAttribute("class", cl+" "+typeonglet);
  }
}


// mantis 0005509: Harmonisation design barre d'outils principale
// id : identifiant bouton
function cmelSwitchToApp(id){
    
  if ("btCMel-courrier"==id){
    document.getElementById('tabmail').switchToTab(0);
  } else if ("btCMel-contacts"==id){
    OuvreEnOnglet('chrome://messenger/content/addressbook/addressbook.xul', 'cm2-tab-abook');
  } else if ("btCMel-agenda"==id){
    document.getElementById('tabmail').openTab('calendar', { title: document.getElementById(id).getAttribute('label') });
  } else if ("btCMel-taches"==id){
    document.getElementById('tabmail').openTab('tasks', { title: document.getElementById(id).getAttribute('label') });
  } else if ("btCMel-sondage"==id){
    webtabs.openWebAppTab('pegase');
  } else if ("btCMel-discus"==id){
    // 0005592 webtabs.openWebAppTab('ariane');
    Cm2OuvreLienPrefExterne("courrielleur.url.discussion");
  } else if ("btCMel-param"==id){
    webtabs.openWebAppTab('roundcube');
  }
}
