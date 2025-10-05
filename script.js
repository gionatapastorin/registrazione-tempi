document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURAZIONE ---
    // INCOLLA QUI L'URL DELLA TUA WEB APP DEPLOYATA DA GOOGLE APPS SCRIPT
    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby_VKAWwJFeeQLSFkDHbi83smqJGnhXKnm3gd9GISMKfWFcX4fxM-30NtJUwAtZPV3w/exec';
    // --------------------


    // Elementi del DOM
    const form = document.getElementById('work-form');
    const operatorSelect = document.getElementById('operatore');
    const commessaSelect = document.getElementById('commessa');
    const faseSelect = document.getElementById('fase');
    const startButton = document.getElementById('start-button');
    const endButton = document.getElementById('end-button');
    const messageBox = document.getElementById('message-box');
    const loader = document.getElementById('loader');

    /**
     * Mostra o nasconde il loader e abilita/disabilita il form.
     * @param {boolean} isLoading - True per mostrare il loader, false per nasconderlo.
     */
    const setLoadingState = (isLoading) => {
        loader.style.display = isLoading ? 'block' : 'none';
        form.style.display = isLoading ? 'none' : 'block';
    };

    /**
     * Popola un elemento <select> con le opzioni fornite.
     * @param {HTMLSelectElement} selectElement - L'elemento select da popolare.
     * @param {Array<string|Object>} options - L'array di opzioni.
     * @param {string} placeholder - Il testo da mostrare come prima opzione disabilitata.
     */
    const populateSelect = (selectElement, options, placeholder) => {
        selectElement.innerHTML = `<option value="" disabled selected>${placeholder}</option>`;
        options.forEach(option => {
            const optionElement = document.createElement('option');
            if (typeof option === 'object' && option !== null) {
                // Per le commesse {value, text}
                optionElement.value = option.value;
                optionElement.textContent = option.text;
            } else {
                // Per operatori e fasi (stringhe semplici)
                optionElement.value = option;
                optionElement.textContent = option;
            }
            selectElement.appendChild(optionElement);
        });
    };

    /**
     * Mostra un messaggio all'utente nella message box.
     * @param {string} message - Il messaggio da visualizzare.
     * @param {'success'|'error'} type - Il tipo di messaggio.
     */
    const showMessage = (message, type) => {
        messageBox.textContent = message;
        messageBox.className = `message-box ${type}`;
        messageBox.style.display = 'block';
        setTimeout(() => {
            messageBox.style.display = 'none';
        }, 5000); // Nasconde il messaggio dopo 5 secondi
    };

    /**
     * Carica i dati iniziali (operatori, commesse, fasi) dall'API di Apps Script.
     */
    const fetchInitialData = async () => {
        setLoadingState(true);
        try {
            if (APPS_SCRIPT_URL.includes('YOUR_DEPLOYMENT_ID')) {
                 throw new Error("Per favore, imposta l'URL di Apps Script nel file script.js.");
            }
            const response = await fetch(`${APPS_SCRIPT_URL}?action=getInitialData`);
            if (!response.ok) {
                throw new Error(`Errore di rete: ${response.statusText}`);
            }
            const data = await response.json();
            if (data.status === 'success') {
                populateSelect(operatorSelect, data.data.operatori, 'Seleziona operatore');
                populateSelect(commessaSelect, data.data.commesse, 'Seleziona commessa');
                populateSelect(faseSelect, data.data.fasi, 'Seleziona fase');
            } else {
                throw new Error(data.message || 'Errore nel caricamento dati.');
            }
        } catch (error) {
            showMessage(error.message, 'error');
        } finally {
            setLoadingState(false);
        }
    };
    
    /**
     * Gestisce l'invio dell'azione (inizio o fine) all'API di Apps Script.
     * @param {'startWork'|'endWork'} action - L'azione da eseguire.
     */
    const handleAction = async (action) => {
        // Validazione
        if (!operatorSelect.value || !commessaSelect.value || !faseSelect.value) {
            showMessage('Per favore, compila tutti i campi.', 'error');
            return;
        }

        const requestData = {
            action: action,
            operatore: operatorSelect.value,
            codiceCommessa: commessaSelect.value,
            fase: faseSelect.value,
        };
        
        setLoadingState(true);
        messageBox.style.display = 'none';

        try {
            const response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8', // Apps Script POST richiede questo header
                },
                body: JSON.stringify(requestData),
                mode: 'cors', // Necessario per richieste cross-origin
            });

            const result = await response.json();

            if (result.status === 'success') {
                showMessage(result.message, 'success');
                form.reset(); // Resetta il form in caso di successo
            } else {
                throw new Error(result.message || 'Si è verificato un errore.');
            }
        } catch (error) {
            showMessage(error.message, 'error');
        } finally {
            setLoadingState(false);
        }
    };

    // Event Listeners
    startButton.addEventListener('click', () => handleAction('startWork'));
    endButton.addEventListener('click', () => handleAction('endWork'));
    
    // Caricamento iniziale dei dati
    fetchInitialData();
});
