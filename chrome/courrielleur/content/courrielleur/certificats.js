
ChromeUtils.import("resource://gre/modules/FileUtils.jsm");
ChromeUtils.import("resource://gre/modules/Services.jsm");
ChromeUtils.import("resource://gre/modules/NetUtil.jsm");

const nsX509CertDB="@mozilla.org/security/x509certdb;1";
const nsIX509CertDB=Components.interfaces.nsIX509CertDB;
const nsIX509Cert=Components.interfaces.nsIX509Cert;
const nsPK11TokenDB="@mozilla.org/security/pk11tokendb;1";
const nsIPK11TokenDB=Components.interfaces.nsIPK11TokenDB;

const CERT_TRUST="C,C,C";


//preference version certificat
const PREF_VERSION_CERTIFICAT="courrielleur.versioncert";
const VERSION_CERTIFICAT=81;


//emplacement fichier : chrome://courrielleur/content/certs/
// certificats à ajouter ou supprimer
const cm2ConfigCerts=[
  // suppression (pas de fichier)
  // AC-ANTSv3-AAE-1.pem
  {fichier:"",
    commonName:"Autorité de Certification Personnes AAE",
    sha256Fingerprint:"B5:45:6F:7A:69:61:A4:9C:53:7C:CC:1D:50:76:7D:2D:FA:06:5F:54:0E:86:E1:C9:92:FF:32:4E:B8:18:C8:4F"},
  // AC-ANTSv3Interne-SA-1.pem
  {fichier:"",
    commonName:"Autorité de Certification Services Applicatifs Interne",
    sha256Fingerprint:"CF:83:83:65:F1:7B:7B:E7:F2:4D:CF:09:F2:3A:46:7C:16:F8:6C:CA:E1:AC:A3:30:E0:39:ED:10:4E:9F:82:5A"},
  // AC-ANTSv3-ServicesApplicatifs-1.pem
  {fichier:"",
    commonName:"Autorité de Certification Services Applicatifs",
    sha256Fingerprint:"67:B7:DE:F3:C6:E6:8A:7A:9E:79:EF:77:EF:28:1D:C8:0F:12:76:42:03:7E:2F:B5:51:92:30:E4:8C:30:3E:9E"},

  // ajouts
  {fichier:"IGC-AACracineEtatfrancais.pem",
    commonName:"IGC/A AC racine Etat francais",
    sha256Fingerprint:"1E:1A:69:84:B4:E7:6B:D7:09:AE:E3:E9:C9:CF:31:18:EA:C0:96:DA:B9:CC:20:DC:25:FA:AB:67:29:7E:96:5A"},
  {fichier:"AC-MinDD-racine-avecIGCA-2-0-20100929.pem",
    commonName:"AC Racine - Secteur public developpement durable",
    sha256Fingerprint:"64:A3:7C:47:C7:6A:BB:7B:31:B6:5B:65:AF:51:E9:0F:BA:AA:58:EA:A0:E5:E7:6D:43:C2:6C:21:39:91:68:5B"},
  {fichier:"AC-ANTSv3-Racine-1.pem",
    commonName:"Autorité de Certification Racine ANTS/A V3",
    sha256Fingerprint:"41:B2:DA:D9:32:9C:B4:50:81:E2:CF:B4:49:D6:25:64:D2:74:66:91:49:E9:57:EE:D2:18:2B:C8:20:BE:BA:D6"},
  {fichier:"AC-ANTSv3-AAE-2.pem",
    commonName:"Autorité de Certification Personnes AAE",
    sha256Fingerprint:"75:B7:CC:2E:24:65:11:D8:CD:BB:C5:75:3D:C3:A6:22:50:E3:9E:D3:AD:44:A5:35:9F:0B:56:65:78:17:C9:34"},
  {fichier:"AC-ANTSv3Interne-Racine-1.pem",
    commonName:"Autorité de Certification Racine ANTS Interne V3",
    sha256Fingerprint:"1F:BB:9D:F0:74:31:69:CD:05:78:C9:76:F3:33:AB:44:83:21:28:64:DC:86:0C:7C:AE:0F:30:1D:8D:02:45:DE"},

  {fichier:"AC-ANTSv3-Racine-IGCA.pem",
    commonName:"Autorité de Certification Racine ANTS/A V3",
    sha256Fingerprint:"61:9B:7B:96:34:CA:83:04:EE:D0:05:4D:BA:43:C1:F7:5E:7B:50:18:6B:BA:71:25:07:1C:93:59:65:AB:48:3A"},
  {fichier:"IGCAACracineEtatfrancais.pem",
    commonName:"IGC/A AC racine Etat francais",
    sha256Fingerprint:"BB:39:1F:02:F2:FC:A3:14:E3:4D:CA:14:91:1C:04:43:D7:3B:AA:64:91:21:39:D6:76:D5:2A:98:5E:72:DF:CD"},
];





/*
  Gere les certificats personnels (ajout/mise a jour/suppression)
*/
function MajCertificats() {

}

MajCertificats.prototype={

  __certdb : null,

  get _certdb() {

    if (null==this.__certdb) {
      this.__certdb=Components.classes[nsX509CertDB].getService(nsIX509CertDB);
    }
    return this.__certdb;
  },

  // suppression d'un certificat
  // config => {fichier:"",
  //            commonName:"",
  //            sha256Fingerprint:""}
  // return true si suppression ou certificat absent, false sinon
  supprimeCert : function(config) {

    let cert=this.GetCertificatFromBase(config);

    if (null==cert)
      return true;

    try {

      CourrielleurTrace("MajCertificats supprimeCert suppression de:"+cert.commonName);

      this._certdb.deleteCertificate(cert);
      cert=null;

      return true;

    } catch(ex) {
      CourrielleurTrace("MajCertificats supprimeCert exception:"+ex);
    }

    return false;
  },

  //  ajout certificat
  // config => {fichier:"",
  //            commonName:"",
  //            sha256Fingerprint:""}
  // retourne true si ajout, false sinon
  ajouteCert: function(config) {

    if (null!=this.GetCertificatFromBase(config))
      return false;

    try{

      let cert=this.construitCertificat(config);

      let derstr=getDERString(cert);
      this._certdb.addCert(derstr, CERT_TRUST);

      CourrielleurTrace("MajCertificats ajouteCert nouveau certificat ajoute:"+config.commonName);

      return true;

    } catch(ex){
      CourrielleurTrace("MajCertificats ajouteCert erreur:"+ex);
    }
    return false;
  },


  // création instance certificat:
  // => nsIX509Cert nsIX509CertDB::constructX509FromBase64(in ACString base64);
  // config => {fichier:"",
  //            commonName:"",
  //            sha256Fingerprint:""}
  // retourne nsIX509Cert
  construitCertificat: function(config){

    if (null==config.fichier || ""==config.fichier)
      return null;

    try{

      let scriptableStream=Components.classes["@mozilla.org/scriptableinputstream;1"]
                                      .getService(Components.interfaces.nsIScriptableInputStream);

      let channel=NetUtil.newChannel({uri: "chrome://courrielleur/content/certs/"+config.fichier, loadUsingSystemPrincipal: true});
      let input=channel.open();
      scriptableStream.init(input);
      let l=input.available();
      let certfile=scriptableStream.read(l);
      scriptableStream.close();
      input.close();

      let debut=0;
      let beginCert="-----BEGIN CERTIFICATE-----";
      let endCert="-----END CERTIFICATE-----";
      certfile=certfile.replace(/[\r\n]/g, "");

      while (true){

        let d=certfile.indexOf(beginCert,debut);
        if (-1==d)
          break;
        let f=certfile.indexOf(endCert,d);
        let cert=certfile.substring(d+beginCert.length, f);

        let certificat=this._certdb.constructX509FromBase64(cert);

        return certificat;
      }

    } catch(ex){
      CourrielleurTrace("MajCertificats construitCertificat erreur:"+ex);
    }
    return null;
  },

  // retourne cert si present dans la base, sinon null
  // config => {fichier:"",
  //            commonName:"",
  //            sha256Fingerprint:""}
  GetCertificatFromBase: function(config){

    try{

      let certliste=this._certdb.getCerts();
      let enumerator=certliste.getEnumerator();
      while (enumerator.hasMoreElements()){
        let cert=enumerator.getNext().QueryInterface(Components.interfaces.nsIX509Cert);
        if (null==cert) continue;
        if (cert.commonName==config.commonName &&
            cert.sha256Fingerprint==config.sha256Fingerprint){

          return cert;
        }
      }

    } catch(ex){
      CourrielleurTrace("MajCertificats GetCertificatFromBase erreur:"+ex);
    }
    return null;
  }
};


// teste si certificats a jour - return true si a jour
function cm2CertificatAjour() {

  //preference d'etat
  if (Services.prefs.prefHasUserValue(PREF_VERSION_CERTIFICAT)){
    let ver=Services.prefs.getIntPref(PREF_VERSION_CERTIFICAT);
    if (VERSION_CERTIFICAT<=ver){
      CourrielleurTrace("cm2CertificatAjour certificats a jour version:"+ver);
      return true;
    } else{
      CourrielleurTrace("cm2CertificatAjour certificats pas a jour version du profil:"+ver);
    }
  } else {
    CourrielleurTrace("cm2CertificatAjour certificats pas a jour (pas de version dans le profil)");
  }

  return false;
}

// fonction principale de mise à jour des certificats
// pour ajouts et/ou suppressions en un seul appel (depuis splash.js)
function cm2MajCertificats(){

  if (cm2CertificatAjour())
    return;

  // parcours de la liste des fichiers certificat .pem puis ajout et/ou suppression
  let majcert=new MajCertificats();
  let erreur=false;

  // certificats à supprimer
  for (var config of cm2ConfigCerts){
    if (""==config.fichier){
      let res=majcert.supprimeCert(config);
      if (!res) erreur=true;
      CourrielleurTrace("cm2MajCertificats resultat suppression:"+(res?"succes":"echec"));
    }
  }

  // certificats à ajouter
  for (var config of cm2ConfigCerts){
    if (""!=config.fichier){
      let cert=majcert.GetCertificatFromBase(config);
      if (cert) continue;
      let res=majcert.ajouteCert(config);
      if (!res) erreur=true;
      CourrielleurTrace("cm2MajCertificats resultat ajout:"+(res?"succes":"echec"));
    }
  }

  // mise à jour version
  if (!erreur) {
    Services.prefs.setIntPref(PREF_VERSION_CERTIFICAT, VERSION_CERTIFICAT);
    CourrielleurTrace("cm2MajCertificats succes mise a jour des certificats");
  } else {
    CourrielleurTrace("cm2MajCertificats echec mise a jour des certificats");
  }
}
