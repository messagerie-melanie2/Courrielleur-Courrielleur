ChromeUtils.import("resource://gre/modules/Services.jsm");

ChromeUtils.import("resource://gre/modules/cm2autocompact.jsm");


var gCompacteur=null;

var bundleCm2=null;

function loadDlg(){
  
  if("arguments" in window && window.arguments.length > 0) {
    
    let args=window.arguments[0];
    
    if (!args.compacteur){
      window.close();
    }        
    
    gCompacteur=args.compacteur;
    
    InitLibCompactage(gCompacteur.totalExpungedBytes);
    
  } else {
    window.close();
  }
}

function InitLibCompactage(total){
  
  let compactSize=gCompacteur.FormatFileSize(total);
  let bundle=Services.strings.createBundle("chrome://courrielleur/locale/courrielleur.properties");
  let confirmString=bundle.formatStringFromName("autocompactMessage", [compactSize], 1);
  let lib=document.getElementById("cm2lib-autocompact");
  lib.textContent=confirmString;
}

function Compacter(){
  
  ModeOffline(true);
  
  // autocompactEncours
  bundleCm2=Services.strings.createBundle("chrome://courrielleur/locale/courrielleur.properties");
  let str=bundleCm2.GetStringFromName("autocompactEncours");
  let lib=document.getElementById("cm2lib-autocompact");
  lib.textContent=str;
  
  let bt=document.getElementById("btOk");
  bt.disabled=true;
  bt=document.getElementById("btQuit");
  bt.disabled=true;
  
  let vu=document.getElementById("compactvu");
  vu.mode="undetermined";
  
  window.setCursor("wait");
  
  gCompacteur.Compactage(FinCompactage);
}

function FinCompactage(result){
  
  window.setCursor("auto");
  
  // autocompactFin
  let str=bundleCm2.GetStringFromName("autocompactFin");
  let lib=document.getElementById("cm2lib-autocompact");
  lib.textContent=str;
  
  let vu=document.getElementById("compactvu");
  vu.mode="determined";
  
  ModeOffline(false);
  
  window.alert("Compactage terminé");
  closeDlg();
}

function closeDlg(){
  
  ModeOffline(false);
  
  window.setCursor("auto");
  
  window.close();
}

// passe en offline si setoffline à true et
// 'courrielleur.autocompact.offline' à true
// et etat courant online
var gOnlineInitial=true;
function ModeOffline(setoffline){
  
  let val=Services.prefs.getBoolPref("courrielleur.autocompact.offline");
  if (false==val)
    return;
  
  if (setoffline){
    
    gOnlineInitial=!Services.io.offline;
     
    if (!gOnlineInitial)
      return;
    
    Services.console.logStringMessage("Cm2AutoCompactage passage offline");
    Services.io.offline=true;
    
  } else {
    
    if (gOnlineInitial){
      Services.console.logStringMessage("Cm2AutoCompactage retour online");
      Services.io.offline=false;
    }      
  }
}
