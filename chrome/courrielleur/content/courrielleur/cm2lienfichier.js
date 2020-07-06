ChromeUtils.import("resource://gre/modules/Services.jsm");

const CM2_CMD_INSERTION="cmd_insertText";

const Cc=Components.classes;
const Ci=Components.interfaces;

/**
* traitement commande d'insertion
*/
function cmdCm2InsertLien(strmode){

  if ("fichier"==strmode){
    Cm2SelectionFichiers();
    return;
  }

  if ("dossier"==strmode){
    Cm2SelectionDossier();
    return;
  }
}


/**
*	Sélection d'un dossier pour ajout des liens
*/
function Cm2SelectionDossier(){

  try{

    let fp=Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
    fp.init(window, "S\u00e9lectionner un dossier", Ci.nsIFilePicker.modeGetFolder);
    fp.appendFilters(Ci.nsIFilePicker.filterAll);

    fp.open(function(rv){

      if (Ci.nsIFilePicker.returnOK!=rv){
        return;
      }

      //insérer le dossier sélectionné
      let dossier=fp.file;
      dossier=dossier.QueryInterface(Ci.nsIFile);

      cm2InsereLienFileMsg(dossier);
    });
  }
  catch(ex){
    alert("Erreur d'ajout du lien.",ex);
  }
}


/**
*	Sélection de fichier(s) pour ajout des liens
*/

function Cm2SelectionFichiers(){

  try{

    let fp=Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
    fp.init(window, "S\u00e9lectionner un ou plusieurs fichier(s)", Ci.nsIFilePicker.modeOpenMultiple);
    fp.appendFilters(Ci.nsIFilePicker.filterAll);

    fp.open(function(rv){

      if (Ci.nsIFilePicker.returnOK!=rv){
        return;
      }

      //insérer les fichiers sélectionnés
      let fichiers=fp.files;

      while (fichiers.hasMoreElements()){

        let fic=fichiers.getNext();

        fic=fic.QueryInterface(Ci.nsIFile);

        cm2InsereLienFileMsg(fic);
      }
    });
  }
  catch(ex){
    alert("Erreur d'ajout du(des) lien(s)"+ex);
  }
}



/*
* Insertion d'un lien dans le message
*
*/
function Cm2InsereLienMsg(lien){

  try {

    CourrielleurTrace("Cm2InsereLienMsg lien="+lien);

    //content-frame
    let editeur=document.getElementById("content-frame");
    editeur=editeur.getEditor(editeur.contentWindow);
    let editxt=editeur.QueryInterface(Ci.nsIPlaintextEditor);
    editxt.insertText(" "+lien);
    editxt.insertLineBreak();

  } catch(ex){
    alert("Erreur d'ajout du(des) lien(s)"+ex);
  }
}

/* fichier : nsIFile */
function cm2InsereLienFileMsg(fichier){

  try {

    CourrielleurTrace("cm2InsereLienFileMsg fichier ou dossier="+fichier.path);

    let nsuri=Services.io.newFileURI(fichier);

    Cm2InsereLienMsg(nsuri.spec);

  } catch(ex){
    alert("Erreur d'ajout du(des) lien(s)"+ex);
  }
}
