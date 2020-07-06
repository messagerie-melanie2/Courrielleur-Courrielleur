ChromeUtils.import("resource:///modules/mailServices.js");
ChromeUtils.import("resource://gre/modules/Services.jsm");
ChromeUtils.import("resource:///modules/iteratorUtils.jsm");


// ChromeUtils.import("resource://gre/modules/cm2autocompact.jsm");Cm2AutoCompactage();


const EXPORTED_SYMBOLS = ["Cm2AutoCompactage"];

var gCm2Compacteur=null;

var gDebugMsg=false;

function cm2AutoCompactDebug(msg){
  
  if (gDebugMsg)
    Services.console.logStringMessage(" *** cm2autocompact.jsm "+msg);
}


// version js et adaptee de:
// nsresult nsMsgDBFolder::HandleAutoCompactEvent(nsIMsgWindow *aWindow)
function Cm2AutoCompactage(){
  
  try{
    gDebugMsg=Services.prefs.getBoolPref("courrielleur.autocompact.debug");    
  } catch(ex){}
  
  cm2AutoCompactDebug("cm2AutoCompactage");
  
  var totalExpungedBytes=0;
  
  gCm2Compacteur=new cm2Compacteur();
  
  try{
    
    totalExpungedBytes=gCm2Compacteur.Analyse();
    
  } catch(ex){
    
    cm2AutoCompactDebug("Cm2AutoCompactage exception:"+ex);
    return;
  }
  
  var purgeThreshold=cm2GetSeuilCompact();
  cm2AutoCompactDebug("Cm2AutoCompactage seuil:"+purgeThreshold);
  
  if (totalExpungedBytes > (purgeThreshold * 1024 * 1024)){
    
    var args={compacteur:gCm2Compacteur};
    
    let mail3Pane=Services.wm.getMostRecentWindow("mail:3pane");
    mail3Pane.openDialog("chrome://courrielleur/content/autocompact.xul", "", "dialog,centerscreen,titlebar,modal", args);
    
    // memoriser time
    var dernier=Date.now()/1000;
    cm2AutoCompactDebug("Cm2AutoCompactage dernier:"+dernier);
    Services.prefs.setIntPref("courrielleur.autocompact.dernier", dernier);
  
    
  } else {
    
    cm2AutoCompactDebug("Cm2AutoCompactage taille inferieure au seuil");
  } 
   
}

function cm2GetSeuilCompact(){
  
  var seuilCM2=Services.prefs.getIntPref("courrielleur.autocompact.seuil");
  
  var seuilTB=Services.prefs.getIntPref("mail.purge_threshhold_mb");
  
  if (seuilTB<seuilCM2)
    return seuilTB;
  
  return seuilCM2;
}


function cm2Compacteur(){
  
}

cm2Compacteur.prototype={
  
  serveurs:null,
  
  folderArray:null,
  
  offlineFolderArray:null,
  
  localExpungedBytes:0,
  
  offlineExpungedBytes:0,
  
  totalExpungedBytes:0,
  
  rappel:null,
  
  // analyse les comptes et calcule le gain de compactage
  // retourne totalExpungedBytes
  Analyse: function(){
    
    this.totalExpungedBytes=0;
    this.localExpungedBytes=0;
    this.offlineExpungedBytes=0;
    this.folderArray=null;
    this.offlineFolderArray=null;
    
    this.serveurs=MailServices.accounts.allServers;
    var nbServers=this.serveurs.length;
    cm2AutoCompactDebug("cm2Compacteur Analyse nombre serveurs:"+nbServers);
   
    if (0<nbServers){
      
      this.folderArray=Components.classes["@mozilla.org/array;1"].createInstance(Components.interfaces.nsIMutableArray);;
      this.offlineFolderArray=Components.classes["@mozilla.org/array;1"].createInstance(Components.interfaces.nsIMutableArray);;
      
      for (var i=0; i<nbServers; i++){ 
      
        var server=this.serveurs.queryElementAt(i, Components.interfaces.nsIMsgIncomingServer);
        cm2AutoCompactDebug("cm2Compacteur Analyse serveur:"+server.hostName);

        if (null==server.msgStore ||
            !server.msgStore.supportsCompaction ||
            null==server.rootFolder)
          continue;
        
        var rootFolder=server.rootFolder;        
        var offlineSupportLevel=server.offlineSupportLevel;
        cm2AutoCompactDebug("cm2Compacteur Analyse offlineSupportLevel serveur:"+offlineSupportLevel);
        var allDescendents=rootFolder.descendants;
        var nbdos=allDescendents.length;
        var expungedBytes=0;
        cm2AutoCompactDebug("cm2Compacteur Analyse nombre dossiers:"+nbdos);
        
        if (0<offlineSupportLevel){
          
          for (var c=0;c<nbdos;c++){  
          
            var folder=allDescendents.queryElementAt(c, Components.interfaces.nsIMsgFolder);
            expungedBytes=0;
            if (folder.flags &  Components.interfaces.nsMsgFolderFlags.Offline){
              expungedBytes=folder.expungedBytes;
            }
            if (0<expungedBytes){
              cm2AutoCompactDebug("cm2Compacteur Analyse folder:"+folder.URI);
              cm2AutoCompactDebug("cm2Compacteur Analyse expungedBytes:"+expungedBytes);
              this.offlineFolderArray.appendElement(folder, false);
              this.offlineExpungedBytes+=expungedBytes;
            }
          }
          
        } else {
          
          //pop or local
          for (var c=0;c<nbdos;c++){  
          
            var folder=allDescendents.queryElementAt(c, Components.interfaces.nsIMsgFolder);
            expungedBytes=folder.expungedBytes;
            if (0<expungedBytes){
              cm2AutoCompactDebug("cm2Compacteur Analyse folder:"+folder.URI);
              cm2AutoCompactDebug("cm2Compacteur Analyse expungedBytes:"+expungedBytes);
              this.folderArray.appendElement(folder, false);
              this.localExpungedBytes+=expungedBytes;
            }
          }       
        }
      }
      
      this.totalExpungedBytes=this.localExpungedBytes+this.offlineExpungedBytes;
      cm2AutoCompactDebug("cm2Compacteur Analyse total offlineExpungedBytes:"+this.offlineExpungedBytes);
      cm2AutoCompactDebug("cm2Compacteur Analyse total localExpungedBytes:"+this.localExpungedBytes);
      cm2AutoCompactDebug("cm2Compacteur Analyse totalExpungedBytes:"+this.totalExpungedBytes);     
    }
    
    return this.totalExpungedBytes;
  },
  
  Compactage: function(rappel){
    
    var targetWindow=typeof window === 'undefined' ? null : window;
    
    this.rappel=rappel;
     
    if (0<this.localExpungedBytes){   

      var folderCompactor=Components.classes["@mozilla.org/messenger/localfoldercompactor;1"].createInstance(Components.interfaces.nsIMsgFolderCompactor);
      
      if (0<this.offlineExpungedBytes){
        cm2AutoCompactDebug("CompactFolders folderArray offlineFolderArray");
        folderCompactor.compactFolders(this.folderArray, this.offlineFolderArray, this, targetWindow);
      }
      else{
        cm2AutoCompactDebug("CompactFolders folderArray");
        folderCompactor.compactFolders(this.folderArray, null, this, targetWindow);
      }
      
    } else if (0<this.offlineExpungedBytes){
      
      var folderCompactor=Components.classes["@mozilla.org/messenger/offlinestorecompactor;1"].createInstance(Components.interfaces.nsIMsgFolderCompactor);
      
      cm2AutoCompactDebug("offlineFolderArray");
      folderCompactor.compactFolders(null, this.offlineFolderArray, this, targetWindow);
    }
  },
  
  
  FormatFileSize: function(taillle){
  
    return Math.round(taillle/1024/1024)+" Mo";
  },
  
  
  OnStartRunningUrl: function(url){
    cm2AutoCompactDebug("cm2Compacteur OnStartRunningUrl url:"+url);
    
  },

  OnStopRunningUrl: function(url, aExitCode){
    cm2AutoCompactDebug("cm2Compacteur OnStopRunningUrl aExitCode:"+aExitCode);

    if (this.rappel)
      this.rappel(aExitCode);
  }   
}

