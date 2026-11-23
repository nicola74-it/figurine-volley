const { createApp, ref, computed, onMounted } = Vue;

const STORAGE_KEY = 'volley_roster_dynamic_v1';

const RANDOM_POOL = {
  nomi: [
    "Marco Rossi", "Luca Bianchi", "Andrea Verdi", "Giulia Neri",
    "Matteo Ferri", "Sara Conti", "Davide Gallo", "Chiara Romano",
    "Simone Costa", "Elena Ricci", "Francesco Bruno", "Martina Greco"
  ],
  soprannomi: [
    "Mani di Piuma", "Er Muro di Gomma", "Il Cecchino del Tendone",
    "Sacco di Patate", "Alzata a Campanile", "Re del Terzo Tempo",
    "Pallonetto Corto", "Doppia Garantita", "Schiaccia-Mosche"
  ],
  ruoli: [
    { ruolo: "Palleggiatore", tema: "purple" },
    { ruolo: "Centrale", tema: "blue" },
    { ruolo: "Schiacciatore", tema: "red" },
    { ruolo: "Libero", tema: "green" },
    { ruolo: "Opposto", tema: "gold" }
  ],
  scuse: [
    "Era alzata tesa, sei tu che sei partito in ritardo!",
    "Non l'ho toccata! La palla ha cambiato giro da sola!",
    "C'erano i faretti negli occhi, non vedevo la rete!",
    "Nessuno me l'ha chiamata, pensavo uscisse di un metro!",
    "Il pallone è troppo sgonfio e scivola dalle mani!",
    "Ho ancora il polpaccio indurito dal riscaldamento!"
  ],
  mosse: [
    {
      m1N: "Doppia Invisibile", m1D: "40+", m1Desc: "L'arbitro fischia ma giura che la palla girava dritta.",
      m2N: "Alzata al Soffitto", m2D: "80", m2Desc: "Colpisce i neon della palestra accecando i centrali."
    },
    {
      m1N: "Mani Out Garantito", m1D: "50", m1Desc: "Salta in ritardo e regala il mani-fuori all'attaccante.",
      m2N: "Primo Tempo Fantasma", m2D: "110", m2Desc: "Salta mezz'ora prima del palleggio urlando 'MIO!'."
    },
    {
      m1N: "Battuta in Rete", m1D: "30", m1Desc: "Rincorsa da Serie A, palla piantata a metà nastro.",
      m2N: "Schiacciata Sulle Mani", m2D: "120x", m2Desc: "Tira a 100 km/h esattamente dove c'è il muro a due."
    },
    {
      m1N: "Tuffo Plastico Tardivo", m1D: "40", m1Desc: "Scivola sul taraflex 2 secondi dopo che la palla è caduta.",
      m2N: "Bagher in Tribuna", m2D: "70", m2Desc: "Spedisce la ricezione direttamente al bar del palazzetto."
    }
  ],
  debolezze: ["Ricezione staccata x2", "Pallonetti dietro x2", "Ricezione flottante x2", "Palle cortissime x2"],
  ritirate: ["1 Giro di Birre", "2 Spritz", "1 Teglia Pizza", "Crostata della nonna"],
  note: [
    "Porta sempre patatine e taralli, ma finisce le birre degli altri.",
    "Capitano indiscusso della grigliata di fine campionato.",
    "Specialista nel lamentarsi del pallone troppo sgonfio.",
    "Unico della squadra ad avere ancora ginocchia funzionanti."
  ]
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function createRandomPlayer(id, numero) {
  const roleObj = pickRandom(RANDOM_POOL.ruoli);
  const moveObj = pickRandom(RANDOM_POOL.mosse);
  return {
    id,
    nome: pickRandom(RANDOM_POOL.nomi),
    soprannome: pickRandom(RANDOM_POOL.soprannomi),
    numero: String(numero),
    ruolo: roleObj.ruolo,
    tema: roleObj.tema,
    fiato: (Math.floor(Math.random() * 6) + 6) * 10,
    altezza: `${Math.floor(Math.random() * 35) + 165} cm`,
    elevazione: pickRandom(["2 fogli A4", "15 cm (con vento)", "45 cm", "Non pervenuta"]),
    foto: "",
    scusa: pickRandom(RANDOM_POOL.scuse),
    mossa1Nome: moveObj.m1N,
    mossa1Danno: moveObj.m1D,
    mossa1Desc: moveObj.m1Desc,
    mossa2Nome: moveObj.m2N,
    mossa2Danno: moveObj.m2D,
    mossa2Desc: moveObj.m2Desc,
    debolezza: pickRandom(RANDOM_POOL.debolezze),
    ritirata: pickRandom(RANDOM_POOL.ritirate),
    batt: Math.floor(Math.random() * 6) + 3,
    ric: Math.floor(Math.random() * 6) + 3,
    att: Math.floor(Math.random() * 6) + 3,
    dif: Math.floor(Math.random() * 6) + 3,
    muro: Math.floor(Math.random() * 6) + 3,
    alz: Math.floor(Math.random() * 6) + 3,
    note: pickRandom(RANDOM_POOL.note)
  };
}

createApp({
  setup() {
    const players = ref([]);
    const selectedIndex = ref(0);
    const isEditing = ref(false);
    const draftPlayer = ref(null);
    const showJsonModal = ref(false);
    const jsonBuffer = ref('');
    const jsonFileInput = ref(null);

    const currentPlayer = computed(() => players.value[selectedIndex.value] || null);

    // Mostra la bozza durante la modifica, altrimenti il record salvato nel JSON
    const activeData = computed(() => {
      return isEditing.value && draftPlayer.value ? draftPlayer.value : currentPlayer.value;
    });

    function persistJson() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(players.value));
    }

    onMounted(async () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            players.value = parsed;
            return;
          }
        } catch (e) { /* ignore */ }
      }
      try {
        const res = await fetch('giocatori.json');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            players.value = data;
            persistJson();
            return;
          }
        }
      } catch (e) { /* fallback locale */ }

      players.value = [createRandomPlayer(1, 1)];
      persistJson();
    });

    function selectPlayer(idx) {
      if (isEditing.value) {
        if (!confirm('Hai modifiche non confermate. Vuoi scartarle e cambiare giocatore?')) return;
        isEditing.value = false;
        draftPlayer.value = null;
      }
      selectedIndex.value = idx;
    }

    // AGGIUNGI GIOCATORE CASUALE AL JSON
    function addPlayer() {
      if (isEditing.value) {
        if (!confirm('Hai modifiche non confermate. Vuoi scartarle?')) return;
        isEditing.value = false;
        draftPlayer.value = null;
      }
      const nextId = players.value.length > 0
        ? Math.max(...players.value.map(p => Number(p.id) || 0)) + 1
        : 1;
      const newPlayer = createRandomPlayer(nextId, players.value.length + 1);
      players.value.push(newPlayer);
      selectedIndex.value = players.value.length - 1;
      persistJson();
    }

    // ATTIVA MODALITÀ MODIFICA
    function startEditing() {
      if (!currentPlayer.value) return;
      draftPlayer.value = JSON.parse(JSON.stringify(currentPlayer.value));
      isEditing.value = true;
    }

    // CONFERMA MODIFICHE NEL JSON
    function saveEditing() {
      if (!draftPlayer.value) return;
      players.value[selectedIndex.value] = JSON.parse(JSON.stringify(draftPlayer.value));
      isEditing.value = false;
      draftPlayer.value = null;
      persistJson();
    }

    // ANNULLA MODIFICHE
    function cancelEditing() {
      isEditing.value = false;
      draftPlayer.value = null;
    }

    // ELIMINA GIOCATORE DAL JSON
    function deletePlayer() {
      if (!currentPlayer.value) return;
      const name = currentPlayer.value.nome;
      if (!confirm(`Vuoi eliminare definitivamente "${name}" dal JSON?`)) return;
      players.value.splice(selectedIndex.value, 1);
      if (selectedIndex.value >= players.value.length) {
        selectedIndex.value = Math.max(0, players.value.length - 1);
      }
      persistJson();
    }

    function onPhotoUpload(event) {
      if (!isEditing.value || !draftPlayer.value) return;
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        draftPlayer.value.foto = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    function triggerImport() {
      jsonFileInput.value.click();
    }

    function importJsonFile(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          if (!Array.isArray(parsed)) throw new Error('Il file JSON deve contenere un array di giocatori.');
          players.value = parsed;
          selectedIndex.value = 0;
          isEditing.value = false;
          draftPlayer.value = null;
          persistJson();
          alert('File JSON importato con successo!');
        } catch (err) {
          alert('Errore durante la lettura del JSON: ' + err.message);
        }
      };
      reader.readAsText(file);
      event.target.value = '';
    }

    function openJsonModal() {
      jsonBuffer.value = JSON.stringify(players.value, null, 2);
      showJsonModal.value = true;
    }

    function applyJson() {
      try {
        const parsed = JSON.parse(jsonBuffer.value);
        if (!Array.isArray(parsed)) throw new Error('Il JSON deve essere un array di giocatori.');
        players.value = parsed;
        selectedIndex.value = 0;
        isEditing.value = false;
        draftPlayer.value = null;
        persistJson();
        showJsonModal.value = false;
      } catch (err) {
        alert('Errore nel formato JSON: ' + err.message);
      }
    }

    function downloadJson() {
      const blob = new Blob([JSON.stringify(players.value, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'giocatori.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }

    function printSingleCard() {
      document.body.classList.remove('printing-all');
      window.print();
    }

    function printAllCards() {
      document.body.classList.add('printing-all');
      window.print();
      setTimeout(() => document.body.classList.remove('printing-all'), 500);
    }

    function resetDefaultData() {
      if (confirm('Vuoi resettare l\'elenco a un singolo giocatore casuale?')) {
        isEditing.value = false;
        draftPlayer.value = null;
        players.value = [createRandomPlayer(1, 1)];
        selectedIndex.value = 0;
        persistJson();
      }
    }

    return {
      players,
      selectedIndex,
      currentPlayer,
      activeData,
      isEditing,
      showJsonModal,
      jsonBuffer,
      jsonFileInput,
      selectPlayer,
      addPlayer,
      startEditing,
      saveEditing,
      cancelEditing,
      deletePlayer,
      onPhotoUpload,
      triggerImport,
      importJsonFile,
      openJsonModal,
      applyJson,
      downloadJson,
      printSingleCard,
      printAllCards,
      resetDefaultData
    };
  }
}).mount('#app');
