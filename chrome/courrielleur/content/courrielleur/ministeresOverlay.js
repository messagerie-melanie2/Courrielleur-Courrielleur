
ChromeUtils.import("resource://gre/modules/Services.jsm");

window.addEventListener("load",
                        
 function onload(event) {
   
  window.removeEventListener("load", this);
   
  let prefBranch=Services.prefs.getBranch("courrielleur.");

  function setLibFromPref(id, pref) {
    let ctrl=document.getElementById(id);
    if (ctrl){
      ctrl.textContent=prefBranch.getStringPref(pref);
    }
  }

  let lib=prefBranch.getStringPref("listeministeres");
  let ministeres=lib.split(";");
  let ctrl=document.getElementById("listeministeres");
  ctrl.textContent="";
  
  for (let m=0;m<ministeres.length;m++){
    if (0<m){
      let br=document.createElementNS("http://www.w3.org/1999/xhtml","br");
      ctrl.appendChild(br);
    }
    let txt=document.createTextNode(ministeres[m]);
    ctrl.appendChild(txt);
  }

  if (ctrl.hasAttribute("autresministeres") &&
      ctrl.getAttribute("autresministeres")){
    
    // autres ministeres
    lib=prefBranch.getStringPref("autresministeres");
    ministeres=lib.split(";");
  
    for (let m=0;m<ministeres.length;m++){
      if (""==ministeres[m])
        continue;
      let br=document.createElementNS("http://www.w3.org/1999/xhtml","br");
      ctrl.appendChild(br);
      let txt=document.createTextNode(ministeres[m]);
      ctrl.appendChild(txt);
    }
  }

  setTimeout(window.sizeToContent, 0);
 }
);
