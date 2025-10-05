document.addEventListener('DOMContentLoaded', function() {
    // Inizializza i componenti dropdown di Materialize
    var elems = document.querySelectorAll('select');
    M.FormSelect.init(elems);

    // --- CONFIGURAZIONE ---
    // INCOLLA QUI L'URL DELLA TUA WEB APP DEPLOYATA DA GOOGLE APPS SCRIPT
    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby_VKAWwJFeeQLSFkDHbi83smqJGnhXKnm3gd9GISMKfWFcX4fxM-30NtJUwAtZPV3w/exec';
    // --------------------

    const operatoreSelect = document.getElementById('operatore');
    const commessaSelect = document.getElementById('commessa');
    const faseSelect = document.getElementById('fase');
    const startButton = document.getElementById('start-button');
    const endButton = document.getElementById('end-button');
    const messageDiv = document.getElementById('message');

    /**
     * Mostra un messaggio all'utente.
     * @param {string} text - Il messaggio da visualizzare.
     * @param {boolean} isSuccess - True per un messaggio di successo, false per un errore.
     */
    function showMessage(text, isSuccess) {
        messageDiv.textContent = text;
        messageDiv.className = isSuccess ? 'card-panel success' : 'card-panel error';
        messageDiv.style.display = 'block';
        
        // Nasconde il messaggio dopo 5 secondi
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }

    /**
     * Popola un elemento <select> con le opzioni.
     * @param {string} elementId - L'ID dell'elemento select.
     * @param {Array<string|Object>} options - L'array di opzioni.
     */
    function populateSelect(elementId, options) {
        const selectElement = document.getElementById(elementId);
        selectElement.innerHTML = `<option value="" disabled selected>Seleziona ${elementId.charAt(0).toUpperCase() + elementId.slice(1)}</option>`;
        
        options.forEach(option => {
            const optionElement = document.createElement('option');
            if (typeof option === 'object' && option !== null) {
                optionElement.value = option.value;
                optionElement.textContent = option.text;
            } else {
                optionElement.value = option;
                optionElement.textContent = option;
            }
            selectElement.appendChild(optionElement);
        });

        // Re-inizializza il select di Materialize per aggiornare la UI
        M.FormSelect.init(selectElement);
    }

    /**
     * Carica i dati iniziali (operatori, commesse, fasi) dall'API di Apps Script.
     */
    function fetchInitialData() {
        if (APPS_SCRIPT_URL.includes('YOUR_DEPLOYMENT_ID')) {
            showMessage("Per favore, imposta l'URL di Apps Script nel file script.js.", false);
            return;
        }
        fetch(`${APPS_SCRIPT_URL}?action=getInitialData`)
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    populateSelect('operatore', data.data.operatori);
                    populateSelect('commessa', data.data.commesse);
                    populateSelect('fase', data.data.fasi);
                } else {
                    throw new Error(data.message || 'Errore nel caricamento dati.');
                }
            })
            .catch(error => {
                showMessage('Errore di comunicazione: ' + error.message, false);
            });
    }

    /**
     * Gestisce l'invio dell'azione (inizio o fine) all'API di Apps Script.
     * @param {'startWork'|'endWork'} action - L'azione da eseguire.
     */
    function handleAction(action) {
        const operatore = operatoreSelect.value;
        const codiceCommessa = commessaSelect.value;
        const fase = faseSelect.value;

        if (!operatore || !codiceCommessa || !fase) {
            showMessage('Per favore, compila tutti i campi.', false);
            return;
        }

        const requestData = { action, operatore, codiceCommessa, fase };
        
        // Disabilita i bottoni per prevenire click multipli
        startButton.disabled = true;
        endButton.disabled = true;

        fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(requestData),
            mode: 'cors'
        })
        .then(response => response.json())
        .then(result => {
            if (result.status === 'success') {
                showMessage(result.message, true);
                // Resetta i campi
                operatoreSelect.selectedIndex = 0;
                commessaSelect.selectedIndex = 0;
                faseSelect.selectedIndex = 0;
                M.FormSelect.init(document.querySelectorAll('select')); // Re-inizializza
            } else {
                throw new Error(result.message || 'Si è verificato un errore.');
            }
        })
        .catch(error => {
            showMessage(error.message, false);
        })
        .finally(() => {
            // Riabilita i bottoni
            startButton.disabled = false;
            endButton.disabled = false;
        });
    }

    // Aggiungi event listener ai bottoni
    startButton.addEventListener('click', () => handleAction('startWork'));
    endButton.addEventListener('click', () => handleAction('endWork'));

    // Carica i dati all'avvio
    fetchInitialData();
});

