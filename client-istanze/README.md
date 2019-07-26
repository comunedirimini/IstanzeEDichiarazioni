# APP Client Istanze

Sviluppato con Angular Js

gulp build:dist per la generazione


http://srv-webapi.ad.comune.rimini.it:8009/dist/#!/homeIstanze

AgiD Developers Italia

https://italia.github.io/design-web-toolkit/components/detail/text--size.html

Note link


Sicurezza per form senza autenticazione
---------------------------------------

Alla richiesta getInfoIstanza per la configurazione del form
viene rilasciato un token che viene salvato nella cartella token (nomefile md5)

uM.addTokenToList(token);

il client imposta il token in

ISTANZE-API-KEY : token 

al momento dell'invio

Quando il server riceve la richiesta di inserimento istanza attraverso la

uM.checkIfTokenInList

viene recuperato req.header('ISTANZE-API-KEY')

se esiste viene cancellato e si procede all'esecuzione del form.


Sicurezza del form con autenticazione
-------------------------------------

Esiste sempre la "Sicurezza del form senza autenticazione" ed inoltre c'è il controllo dell'utente.
Alla richiesta dei dati del form se è necessaria l'autenticazione, viene ricercato

req.header('Authorization')

se esiste si procede alla decodifica ed all'invio dei dati, 
altrimenti viene risposto con un codice 999 che indica la mancanza di autenticazione
e quindi il rinvio alla pagina di autenticazione SPID con la richiesta

getGatewayAuthUrl che ritorna l'url alla quale si deve accedere per arrivare al gateway di autenticazione
con i dati corretti:

AD ESEMPIO:

https://autenticazione.comune.rimini.it/gw-authFAKE.php?appId=istanze1&data=qgyp65lhckkpajhoY2J5dk1henpMOEVYQXpGWnQ3TWFhZnVSa3kxajJHTjQrVTlwU3F1V0FaR1M2cWJwM2xlSUwrSkdzd05pNGt0eA

la getGatewayAuthUrl aggiunge un token di controllo per autorizzare al ritorno solo le richieste effettivamente partite
dal form attraverso

uM.addTokenToList(uuidStr, fId);


a questo punto si esegue l'autenticazione ed il gateway riporta, se esguita con successo, l'autenticazione
alla pagina:

/gwLanding

controlla che esiste un token relativo alla richiesta getGatewayAuthUrl, se esiste si continua producendo un token
di autenticazione con i dati utente e passandolo alla pagina 

landingGatewayFedera dell'app

che procedere a memorizzare il token fornito nello store locale e

- JWT (web storage - cookie)
- e viene impostato come Authorization header per richieste client successive

rilanciare la richiesta dell'informazioni della istanza eseguiIstanzaDinamica che lancia la caricaImpostazioni.

ora la caricaImpostazioni ha l'header impostato con un Authorization corretto

la getInfoIstanza controlla se esiste l'header e ritorna l'utente in:

loggedUser = uM.ensureAuthenticatedFun(req);

che viene ritornato nella risposta per informazioni del form da visualizzare



LOGICA per l'autenticazione
-----------------------------------

Il client richiede il form al server 

API  getInfoIstanza/FED01 

se il FORM è configurato con autenticazione e non c'è il token nell'header viene risposto con codice 999 (da cambiare)
ed il client redirige alla pagina di login con il codice del FORM

login/FED01

la pagina di login allora richiede l'url per accedere al gateway di autenticazione 

http://localhost:8009/protocollo/getGatewayAuthUrl/FED01


il server risponde con la url per arrivare sul gateway
nel frattempo il gateway si è segnato un log di richiesta per la transazione con lId della transazione.

al client arriva la url del gateway, si passa al gateway per l'autenticazione.
Il Gateway invia a SPID/FEDERA che esegue un POST sul gateway
Il Gateway controlla l'autenticazione e riesegue una GET con i dati di autenticazione verso la pagina configurata del server

gwLanding/

[authenticationMethod] => Array
        (
            [0] => otp
        )

    [dataNascita] => Array
        (
            [0] => 25/05/1970
        )

    [policyLevel] => Array
        (
            [0] => Alto
        )

    [nome] => Array
        (
            [0] => RUGGERO
        )

    [trustLevel] => Array
        (
            [0] => Alto
        )

    [CodiceFiscale] => Array
        (
            [0] => RGGRGR70E25H294T
        )

    [cognome] => Array
        (
            [0] => RUGGERI
        )

    [authenticatingAuthority] => Array
        (
            [0] => Provincia di Rimini
        )