# **ATTENZIONE** PROGETTO FUORI MANUTENZIONE
# Istanze Digitali - Comune di Rimini
## Piccoli procedimenti "crescono" (in digitale)

> Il presente progetto è stato premiato a Forum PA 2017 di Roma - [link alla notizia](http://www.chiamamicitta.it/piccoli-procedimenti-crescono-comune-rimini-premiato-forum-pa-roma/)

## Descrizione

Il progetto implementa un framework agile e componibile per “abilitare” ad una serie di funzionalità previste 
dal CAD i piccoli procedimenti digitali della PA che non ci riescono. 
Nella pubblica amministrazione molti procedimenti interni sono gestiti attraverso gestionali obsoleti, 
fogli di calcolo o file e cartelle. 
Inoltre spesso vi sono procedimenti che nascono e muoiono velocemente. 
Per questo tipo di procedimenti risulta difficile se non impossibile disporre di una interfaccia web per 
raccogliere le istanze in ingresso, essere integrati con SPID e PagoPA, essere integrati con il gestore documentale interno, 
inviare le notifiche sullo stato del procedimento in maniera automatica al cittadino e raccogliere i dati in maniera strutturata.

> Questo framework vuole rispondere a questa esigenza.

### Le principali caratteristiche del framework sono:

-	Integrazione con SPID e FEDERA
-	Integrazione con il software di gestione documentale
-	Interfacce web che seguono le specifiche di design.italia.it
-	Interfaccia di accoglimento istanze facilmente personalizzabile
-	Invio notifiche al cittadino sullo stato dell'istanza presentata
-   Interfacciamento dei flussi dati con i gestionali dell'ufficio
-	Gestione memorizzazione e storico delle istanze presentate dal cittadino
-	Open Source

## Il caso d'uso tipico

Richiesta di prenotazione e rinnovo di una di autorizzazione. 
L'ufficio preposto gestisce le richieste su cartaceo inviato tramite email con allegata la scansione della richiesta e dei documenti di identità del richiedente. Gli operatori aprono una mail alla volta, leggono i documenti, salvano i dati su di un file di excel e i documenti allegati su di una cartella di rete. Le domande vengono protocollate una ad una. Il richiedente non ha nessun dato sullo stato del procedimento se non mediante richiesta telefonica indirizzata all’ufficio stesso.

Applicazione del framework con reingegnerizzazione del procedimento:

-	Si prepara il form web (componibile) per la richiesta dati 
-	Si comunica il link sul sito web dell'ente per accedere la portale per l’inoltro dell’istanza
-	I cittadini richiedenti si autenticano con SPID compilano i dati ed inviano l'istanza
-	L'istanza viene protocollata automaticamente e inoltrata all'ufficio competente mediante il software di gestione documentale interno
-	I dati inviati vengono raccolti automaticamente in un file di excel per la gestione del procedimento da parte dell’ufficio
-	Al cittadino viene inviata automaticamente una notifica di avvio di procedimento con il protocollo e tutte le informazioni necessarie per eventuali chiarimenti
-	Successivamente al cittadino vengono inviate le notifiche sullo stato di avanzamento e completamento del procedimento

## Tecnologie utilizzate

- Le Tecnologie utilizzate per il progetto sono AngularJs per il client e NodeJs per il server

## Architettura

L'architettura della piattaforma si compone di due parti:

- La parte client realizzata con AngularJS permette la visualizzazione e la gestione di un form articolato per l'acquisizione dei dati da parte dell'utente. La web app è stata sviluppata per l'ambiente mobile secondo le specifiche Agid.

- La parte server è realizzata in NodeJs. Per ogni form è presente un file di configurazione che ne descrive i dati da raccogliere e 

## Stato di avanzamento del progetto

- Integrazione con FEDERA/SPID - (fatto)
- Integrazione con PayER/PagoPA - (in sviluppo)
- Integrazione con il software di Gestione Documentale (fatto)
- Interfacce che seguono le specifiche di design.italia.it (in sviluppo/beta pronta)
- Interfaccia di accoglimento istanze facilmente personalizzabile (in sviluppo)
- Interfacciamento dei flussi dati con i gestionali dell'ufficio (fatto filesystem, xls. In sviluppo Mdb)
- Invio della prima notifica ad avvenuta ricezione dell'istanza (fatto)
- Invio delle notifiche successive sullo stato dell'istanza (in sviluppo)
- Invio della notifica di completamente procedimento (in sviluppo)
- Gestione della memorizzazione delle istanze parziali (in sviluppo)
- Open Source (fatto)

## Esempio di modulo richiesta numerazione civica


![Modulo parte prima](https://raw.githubusercontent.com/comunedirimini/IstanzeEDichiarazioni/master/ISTANZE_01.PNG)
![Modulo parte seconda](https://raw.githubusercontent.com/comunedirimini/IstanzeEDichiarazioni/master/ISTANZE_02.PNG)

## Informazioni 

- Comune di Rimini - Ruggero Ruggeri ruggero.ruggeri AT comune.rimini.it 
- 0541/704607 335.5703086


## Documentazione per installazione ed utilizzo

- Work in progress... [documentazione](https://github.com)

