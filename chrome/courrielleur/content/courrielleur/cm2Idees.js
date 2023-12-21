ChromeUtils.import("resource://gre/modules/Services.jsm");
ChromeUtils.import("resource:///modules/mailServices.js");
ChromeUtils.import("resource://gre/modules/pacomeAuthUtils.jsm");


const Cc=Components.classes;
const Ci=Components.interfaces;

// destinataire du message
const cm2Idees_to="projet-mce@gendarmerie.interieur.gouv.fr";


function Valider(){

  let txt=document.getElementById("cm2idees-txt").value;
  if (null==txt || ""==txt){
    alert("La zone de saisie est vide.");
    return;
  }

  let bt=document.getElementById("btvalider");
  bt.disabled=true;

  window.setCursor("wait");

  try{

    EnvoieIdee(txt);

  } catch(ex){
    window.setCursor("auto");
    CourrielleurTrace("[cm2Idees.js] exception:"+ex);
  }
}

function Annuler(){

  window.setCursor("auto");
  window.close();
}



var gIdeesListener={

  plustard:false,

  QueryInterface: function(iid){

    if (iid.equals(Ci.nsIMsgSendListener) ||
        iid.equals(Ci.nsIMsgCopyServiceListener) ||
        iid.equals(Ci.nsISupports))
      return this;
    throw Components.results.NS_NOINTERFACE;
  },

  // nsIMsgCopyServiceListener
  OnStartCopy: function() {},
  OnProgress: function(aProgress, aProgressMax) {},
  SetMessageKey: function(aKey) {},
  GetMessageId: function(aMessageId) {},
  OnStopCopy: function(aStatus) {
    CourrielleurTrace("[cm2Idees.js] OnStopCopy");

    window.setCursor("auto");

    if (this.plustard){
      window.close();
      return;
    }

    if (0==aStatus){

      messageFin();
      window.close();
    }
  },

  // nsIMsgSendListener
  onStartSending: function(aMsgID, aMsgSize){
    CourrielleurTrace("[cm2Idees.js] onStartSending");
  },

  onProgress: function(aMsgID, aProgress, aProgressMax){},
  onStatus: function(aMsgID, aMsg){},

  onStopSending: function(aMsgID, aStatus, aMsg, returnFileSpec){
    CourrielleurTrace("[cm2Idees.js] onStopSending aStatus:"+aStatus+" - aMsg:"+aMsg);

    if (this.plustard)
      return;

    if (0!=aStatus){
      window.setCursor("auto");
      // erreur d'envoi => envoyer plus tard?
      OnErreurEnvoi();
    }
  },

  onSendNotPerformed: function(aMsgID, aStatus){},
  onGetDraftFolderURI: function(aFolderURI){}
};




// si plustard true => envoi plus tard
function EnvoieIdee(texte, plustard){

  CourrielleurTrace("[cm2Idees.js] Envoi du texte:'"+texte+"'");

  let compFields=Cc["@mozilla.org/messengercompose/composefields;1"]
                    .createInstance(Ci.nsIMsgCompFields);
  let params=Cc["@mozilla.org/messengercompose/composeparams;1"]
                .createInstance(Ci.nsIMsgComposeParams);
  params.composeFields=compFields;
  let msgCompose=MailServices.compose.initCompose(params);

  let compte=PacomeAuthUtils.GetComptePrincipal();

  compFields.from=compte.defaultIdentity.email;
  CourrielleurTrace("[cm2Idees.js] EnvoieIdee from:"+compFields.from);
  compFields.to=cm2Idees_to;
  CourrielleurTrace("[cm2Idees.js] EnvoieIdee to:"+compFields.to);
  //compFields.body=texte;
  compFields.subject=getSujet();


  let converter=Cc["@mozilla.org/intl/scriptableunicodeconverter"]
                .createInstance(Ci.nsIScriptableUnicodeConverter);
  converter.charset="UTF-8";
  let corps=converter.ConvertFromUnicode(texte);
  converter.Finish();


  let msgSend=Cc["@mozilla.org/messengercompose/send;1"]
                .createInstance(Ci.nsIMsgSend);

  msgSend.createAndSendMessage(null,
                               compte.defaultIdentity,
                               compte.key,
                               compFields,
                               false,
                               false,
                               (plustard ? Ci.nsIMsgSend.nsMsgQueueForLater :
                                (Services.io.offline ? Ci.nsIMsgSend.nsMsgQueueForLater : Ci.nsIMsgSend.nsMsgDeliverNow)
                               ),
                               null,
                               'text/plain',
                               corps+"\n",
                               null,
                               null,
                               null,
                               gIdeesListener,
                               gIdeesListener,
                               null,
                               "",
                               Ci.nsIMsgCompType.New);

}

function getIdentiteBali(){

  let cp=PacomeAuthUtils.GetComptePrincipal();

  if (null==cp){
    return null;
  }

  return cp.defaultIdentity;
}


function getSujet(){

  let ver=Services.prefs.getCharPref("courrielleur.version");
  return "[BoiteAIdees] Courrielleur "+ver;
}

function messageFin(){

  let strBundle=Services.strings.createBundle("chrome://courrielleur/locale/courrielleur.properties");

  let titre=strBundle.GetStringFromName("cm2idees-merci-titre");
  let msg=strBundle.GetStringFromName("cm2idees-merci-texte");

  Services.prompt.alert(window, titre, msg);
}

// erreur d'envoi du message
function OnErreurEnvoi(){

  // notification utilisateur
  alert("Erreur d'envoi.\nEnvoi plus tard.");

  // envoi plus tard
  var txt=document.getElementById("cm2idees-txt").value;

  gIdeesListener.plustard=true;

  window.setCursor("wait");

  EnvoieIdee(txt, true);

}
