// mantis 4068
// mantis 5128

ChromeUtils.import("resource://gre/modules/Services.jsm");
ChromeUtils.import("resource://gre/modules/cm2impression.jsm");


//printPageSetup.xul
function setupOnLoad(){
  
  let show_headers=cm2printGetShowHeaders();
  let choixentetes=document.getElementById("choixentetes");
  let elem=document.getElementById("entetes");
  elem.selectedIndex=show_headers;
  if (Services.prefs.prefHasUserValue("courrielleur.impression.show_headers")){
    choixentetes.checked=true;
  } else{
    choixentetes.checked=false;
  }
  
  let wintype=opener.document.documentElement.getAttribute('windowtype');
  let grp=document.getElementById("entetes-grp");
  if (!("mail:3pane"==wintype || "mail:messageWindow"==wintype ||
      "mail:printEngine"==wintype)){
    grp.hidden=true;    
  }
  if ("mail:printEngine"==wintype && 
      opener && opener.printEngine && 
      opener.printEngine.doPrintPreview){
    if (4<opener.arguments.length) {
      let msgtype=opener.arguments[4];
      if (Components.interfaces.nsIMsgPrintEngine.MNAB_PRINTPREVIEW_MSG!=msgtype)
        grp.hidden=true;
    }      
  }
}


//printPageSetup.xul
function setupOnAccept(){
  
  let choixentetes=document.getElementById("choixentetes");
  let entetes=document.getElementById("entetes");
  let showheaders=entetes.selectedIndex;
  
  cm2printSetShowHeaders(showheaders, choixentetes.checked);
  // fin mantis 4068
  
  //printPageSetup.xul OnAccept
  return onAccept();
}


//msgPrintEngine.xul
var gMsgUri=null;
var gMsgPrintOpener=null;

function cm2PrintOnLoad(){
  
  cm2InitShowHeaders();

  if (window.arguments &&
      null!=window.arguments[0] &&
      null!=window.arguments[3]) {
    if (window.arguments[3]){
      gMsgUri=window.arguments[1][0];

      gMsgPrintOpener=opener;
    }
  }
}

//msgPrintEngine.xul
function cm2PrintOnUnLoad(){
  
  cm2RestaureShowHeaders();
}



// mantis 4068
var gShowHeadersOriginal=null;

function cm2InitShowHeaders(){
  
  if (null==gShowHeadersOriginal)
    gShowHeadersOriginal=Services.prefs.getIntPref("mail.show_headers");
  
  let print_show_headers=cm2printGetShowHeaders();
  
  Services.prefs.setIntPref("mail.show_headers", print_show_headers);
  Services.prefs.savePrefFile(null);
}

function cm2RestaureShowHeaders(){
  
  if (null!=gShowHeadersOriginal){
    Services.prefs.setIntPref("mail.show_headers", gShowHeadersOriginal);
    Services.prefs.savePrefFile(null);
  }
}


/**
* equivalent InitPrintEngineWindow
* utilise depuis printPreviewBindings.xml doPageSetup dans le cas de modification d'entetes
* ferme et ouvre a nouveau la fenetre d'apercu
*/
function cm2InitPrintEngineWindow(){

  if (gMsgUri && gMsgPrintOpener){

    let msguri=[gMsgUri];
    gMsgPrintOpener.openDialog("chrome://messenger/content/msgPrintEngine.xul", "",
                                "chrome,dialog=no,all,centerscreen",
                                1, msguri, null,
                                true);

    window.close();

    return;
  }

  PrintUtils.printPreview();
}
