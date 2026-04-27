// --- BANCO DE DADOS DE ITENS ---
const ANTIQUES_DATABASE = [
    { name: "Caneta de Einstein", minBid: 15000, realVal: 80000, desc: "Usada para rascunhar a Teoria da Relatividade." },
    { name: "Moeda Romana de Ouro", minBid: 5000, realVal: 35000, desc: "Datada da época de Júlio César." },
    { name: "Relógio de Bolso de Napoleão", minBid: 40000, realVal: 150000, desc: "Parou exatamente no início da Batalha de Waterloo." },
    { name: "Cachimbo de Sherlock Holmes", minBid: 10000, realVal: 50000, desc: "Um item lendário de um detetive famoso." },
    { name: "Primeira Edição de Hamlet", minBid: 100000, realVal: 400000, desc: "Capa de couro original em bom estado." }
];

// --- ESTADO DO JOGO ---
let state = {
    money: 500000,
    inventory: [],
    pawnShopItems: [],
    lastPawnRefresh: 0,
    currentAuction: null
};

// --- INICIALIZAÇÃO ---
window.onload = () => {
    loadGame();
    updateUI();
    showSection('auction');
    
    // Timer para atualizar a loja de penhores a cada 5 minutos
    setInterval(checkPawnRefresh, 1000);
};

// --- PERSISTÊNCIA (LocalStorage) ---
function saveGame() {
    localStorage.setItem('relicHunterSave', JSON.stringify(state));
    updateUI();
}

function loadGame() {
    const saved = localStorage.getItem('relicHunterSave');
    if (saved) {
        state = JSON.parse(saved);
    }
}

// --- LÓGICA DE NAVEGAÇÃO ---
function showSection(section) {
    const main = document.getElementById('main-content');
    main.innerHTML = '';

    if (section === 'auction') renderAuction(main);
    if (section === 'pawn') renderPawn(main);
    if (section === 'work') renderWork(main);
    if (section === 'inventory') renderInventory(main);
}

// --- SEÇÃO: LEILÃO ---
function renderAuction(container) {
    if (!state.currentAuction) {
        const item = ANTIQUES_DATABASE[Math.floor(Math.random() * ANTIQUES_DATABASE.length)];
        state.currentAuction = { ...item, currentBid: item.minBid };
    }

    const auc = state.currentAuction;
    container.innerHTML = `
        <div class="card">
            <h2>Leilão ao Vivo</h2>
            <h3>${auc.name}</h3>
            <p><i>"${auc.desc}"</i></p>
            <p>Lance Mínimo: R$ ${auc.minBid.toLocaleString()}</p>
            <p class="price">Lance Atual: R$ ${auc.currentBid.toLocaleString()}</p>
            <button onclick="placeBid()">Dar Lance (+ R$ 10.000)</button>
            <button onclick="buyAuction()" style="background:green">Arrematar Agora</button>
            <p><small>Atenção: Se pagar mais que o valor real (secreto), terá prejuízo!</small></p>
        </div>
    `;
}

function placeBid() {
    state.currentAuction.currentBid += 10000;
    showSection('auction');
}

function buyAuction() {
    const auc = state.currentAuction;
    if (state.money >= auc.currentBid) {
        state.money -= auc.currentBid;
        state.inventory.push({ ...auc, purchasePrice: auc.currentBid });
        state.currentAuction = null;
        logMsg("Item arrematado com sucesso!");
        saveGame();
        showSection('inventory');
    } else {
        logMsg("Saldo insuficiente!");
    }
}

// --- SEÇÃO: LOJA DE PENHORES ---
function checkPawnRefresh() {
    const now = Date.now();
    if (now - state.lastPawnRefresh > 300000) { // 5 minutos
        state.pawnShopItems = [];
        for (let i = 0; i < 2; i++) {
            state.pawnShopItems.push(ANTIQUES_DATABASE[Math.floor(Math.random() * ANTIQUES_DATABASE.length)]);
        }
        state.lastPawnRefresh = now;
        saveGame();
    }
}

function renderPawn(container) {
    let html = `<h2>Loja de Penhores</h2><p>Estoque renova a cada 5 min.</p><div class="grid">`;
    state.pawnShopItems.forEach((item, index) => {
        const price = Math.floor(item.realVal * 1.3);
        html += `
            <div class="card">
                <h4>${item.name}</h4>
                <p class="price">R$ ${price.toLocaleString()}</p>
                <button onclick="buyFromPawn(${index})">Comprar Item Raro</button>
            </div>
        `;
    });
    html += `</div>`;
    container.innerHTML = html;
}

function buyFromPawn(index) {
    const item = state.pawnShopItems[index];
    const price = Math.floor(item.realVal * 1.3);
    if (state.money >= price) {
        state.money -= price;
        state.inventory.push({ ...item, purchasePrice: price });
        state.pawnShopItems.splice(index, 1);
        logMsg("Você comprou um item raro da loja!");
        saveGame();
        showSection('pawn');
    } else {
        logMsg("Dinheiro insuficiente!");
    }
}

// --- SEÇÃO: TRABALHO ---
function renderWork(container) {
    container.innerHTML = `
        <div class="card">
            <h2>Trabalho Braçal</h2>
            <p>Carregue caixas pesadas para ganhar algum dinheiro extra.</p>
            <button onclick="doWork()">Trabalhar (Ganhar R$ 5.000)</button>
        </div>
    `;
}

function doWork() {
    state.money += 5000;
    logMsg("Você trabalhou duro e ganhou R$ 5.000!");
    saveGame();
}

// --- SEÇÃO: INVENTÁRIO E VENDAS ---
function renderInventory(container) {
    if (state.inventory.length === 0) {
        container.innerHTML = "<p>Seu inventário está vazio.</p>";
        return;
    }

    let html = `<div class="grid">`;
    state.inventory.forEach((item, index) => {
        html += `
            <div class="card">
                <h4>${item.name}</h4>
                <p><small>Pago: R$ ${item.purchasePrice.toLocaleString()}</small></p>
                <button onclick="sellPawn(${index})">Vender (Pechinchar)</button>
                <button class="danger" onclick="sellBlackMarket(${index})">Mercado Negro (Risco)</button>
            </div>
        `;
    });
    html += `</div>`;
    container.innerHTML = html;
}

function sellPawn(index) {
    const item = state.inventory[index];
    // Pechincha: Recebe entre 70% e 100% do valor real
    const offer = item.realVal * (0.7 + Math.random() * 0.3);
    if (confirm(`A loja oferece R$ ${offer.toLocaleString()}. Aceita?`)) {
        state.money += offer;
        state.inventory.splice(index, 1);
        logMsg("Venda concluída na loja de penhores.");
        saveGame();
        showSection('inventory');
    }
}

function sellBlackMarket(index) {
    const item = state.inventory[index];
    
    // 25% de chance de ser preso
    if (Math.random() < 0.25) {
        const fine = 100000;
        state.money -= fine;
        state.inventory.splice(index, 1);
        alert(`ERA POLÍCIA! Você foi preso, perdeu o item e pagou R$ ${fine.toLocaleString()} de multa.`);
    } else {
        // Mercado negro paga entre 150% e 250% do valor real
        const profit = item.realVal * (1.5 + Math.random() * 1.0);
        state.money += profit;
        state.inventory.splice(index, 1);
        logMsg(`Sucesso! Você vendeu por R$ ${profit.toLocaleString()} no mercado negro.`);
    }
    saveGame();
    showSection('inventory');
}

// --- UTILITÁRIOS ---
function updateUI() {
    document.getElementById('balance').innerText = `R$ ${state.money.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function logMsg(text) {
    const bar = document.getElementById('message-bar');
    bar.innerText = text;
    setTimeout(() => { if(bar.innerText === text) bar.innerText = "..."; }, 4000);
          }
