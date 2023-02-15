/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { classes: Cc, interfaces: Ci, utils: Cu } = Components;

ChromeUtils.import("resource://gre/modules/Services.jsm");
ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");
ChromeUtils.import("resource://gre/modules/AppConstants.jsm");
/* Needed for 'TbbbbUtils' */
ChromeUtils.import("resource://gre/modules/oidcAuthUtils.jsm");

const CLI_PARAM_TOKEN = "token";

/**
 * 
 * @param {string} tokenValue - the id token to be used, raw from the cli args
 * @param {boolean} throwCallbackAtLoginWindow - true if the function should search for the pacomemdp dialog and execute the SSO callback
 */
function setToken(tokenValue, throwCallbackAtLoginWindow = false)
{
  try
  {
    if(tokenValue.length > 255)
    {
      // Remove protocol (courrielleur://) from argument
      if(tokenValue.includes('://'))
      {
        tokenValue = tokenValue.split('://')[1];
      }

      // Remove last slash (/) from argument
      const tokenValueLastCharIndex = tokenValue.length - 1;
      // console.log('TokenValueLastChar', tokenValue[tokenValueLastCharIndex]);
      if(tokenValue[tokenValueLastCharIndex] === '/')
      {
        tokenValue = tokenValue.substring(0, tokenValueLastCharIndex);
      }

      // Log request after modifications
      Services.console.logStringMessage(`[OidcCommandLineHandler] Handling the request '-token ${tokenValue}' ...`);

      // Token parsing
      const tokenParts = tokenValue.split('.');
      const payloadJSON = atob(tokenParts[1]);
      const payloadOBJ = JSON.parse(payloadJSON);
  
      // Timestamp check
      const currentTimestamp = new Date().getTime() / 1000;
      const tokenIsNotExpired = payloadOBJ.exp > currentTimestamp;

      // TODO other checks ?
      const otherChecksAreValid = true;
      
      if(tokenIsNotExpired && otherChecksAreValid)
      {
        // Set the token
        TbbbbUtils._token = tokenValue;

        if(throwCallbackAtLoginWindow)
        {
          let windowEnumerator = Services.wm.getEnumerator("");
          let windowFound = false;
          let windowNeeded = 'pacomemdp';
          while (windowEnumerator.hasMoreElements())
          {
              let window = windowEnumerator.getNext();
              let windowType = window.document.documentElement.getAttribute("windowtype");
              // console.log('windowType', windowType);
              // Services.console.logStringMessage('windowType', windowType);
              // let windowName = window.document.title;
              if (windowType === windowNeeded)// && windowName === "myWindowName"
              {
                windowFound = true;

                // Call the callback function
                window.authMethodCallbackSSO();
              }
          }
  
          if(windowFound)
          {
            Services.console.logStringMessage(`[OidcCommandLineHandler] Window "${windowNeeded}" found, SSO callback called, my job here should be done !`);
          }
          else
          {
            Services.console.logStringMessage(`[OidcCommandLineHandler] Couldn't find the window of type "${windowNeeded}" ! Nothing will happen.`);
          }
        }
      }
      else
      {
        Services.console.logStringMessage(`[OidcCommandLineHandler] Provided token is expired or contains wrong data !`);
        // Services.console.logStringMessage(`Le jeton fourni est expiré ou contient des données erronnées !`);
      }
    }
    else
    {
      Services.console.logStringMessage(`[OidcCommandLineHandler] Invalid token provided (length check) !`);
      // Services.console.logStringMessage(`Le jeton fourni est invalide (vérification sur la longueur) !`);
    }
  }
  catch(e)
  {
    Services.console.logStringMessage("[OidcCommandLineHandler] An error occured during the processing of the token, likely the token is invalid, or expired", e);
    console.error("An error occured during the processing of the token, likely the token is invalid, or expired", e);
  }
}

function MyCommandLineHandler() {}

MyCommandLineHandler.prototype = {
  classID: Components.ID("{6d794cb4-f736-4c7a-9d3c-36c9075e619f}"),
  QueryInterface: XPCOMUtils.generateQI([Ci.nsICommandLineHandler]),

  // The name of your command-line argument
  commandLineArgument: CLI_PARAM_TOKEN,

  // The description of your command-line argument that will be shown in the
  // --help output
  commandLineDescription: "Sending authentication tokens to Thunderbird",
  helpInfo: "-token <token>   Used to send an OpenIDConnect token to Thunderbird.\n",
  // commandLineDescription: "Transfert de jeton OpenIDConnect vers Thunderbird pour l'authentification",
  // helpInfo: "-token <jeton>   Permet de faire remonter un jeton OpenIDConnect à Thunderbird\n",

  handle: function nsOidcTokenCommandLineHandler_handle(aCommandLine) {

    // console.log('aCommandLine', aCommandLine);

    // -token <token>
    let tokenValue = null;
    try {
      tokenValue = aCommandLine.handleFlagWithParam(CLI_PARAM_TOKEN, false);
    }
    catch (e)
    {
      Services.console.logStringMessage(`No argument provided after parameter '${CLI_PARAM_TOKEN}'. Expected syntax : '-${CLI_PARAM_TOKEN} <token>'.`);
      // Services.console.logStringMessage(`Aucun argument fourni après le paramètre '${CLI_PARAM_TOKEN}'. Syntaxe attendue : '-${CLI_PARAM_TOKEN} <jeton>'.`);
    }

    if (tokenValue && tokenValue.length > 0)
    {
      Services.console.logStringMessage("[OidcCommandLineHandler] Handling the request '-token <token>' ...");
      // Services.console.logStringMessage(`Traitement de la requête '-token ${tokenValue}' ...`);

      let enumerator = Services.wm.getEnumerator("mail:3pane");
      if (!enumerator.hasMoreElements())
      {
        // This is the first instance of Thunderbird that is running
        Services.console.logStringMessage("[OidcCommandLineHandler] Lancement du Courrielleur et du SSO à la suite ...");

        // other startup tasks will run
        // aCommandLine.preventDefault = false;

        // Set token only, the startup tasks will call SSO functions after seeing that the token is here
        setToken(tokenValue, false);
      }
      else
      {
        // Another instance of Thunderbird is already running
        Services.console.logStringMessage("[OidcCommandLineHandler] Courrielleur déjà lancé, lancement du SSO seulement ...");

        // Do not handle other startup tasks
        aCommandLine.preventDefault = true;

        // Set token, search pacomemdp dialog, execute SSO callback
        setToken(tokenValue, true);
      }
    }
  },
};

var NSGetFactory = XPCOMUtils.generateNSGetFactory([MyCommandLineHandler]);