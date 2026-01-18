let pokemonData = [];

const typeColors = {
    grass: "#78C850", fire: "#F08030", water: "#6890F0", bug: "#A8B820",
    normal: "#A8A878", poison: "#A040A0", electric: "#F8D030", ground: "#E0C068",
    fairy: "#EE99AC", fighting: "#C03028", psychic: "#F85888", rock: "#B8A038",
    ghost: "#705898", ice: "#98D8D8", dragon: "#7038F8", flying: "#A890F0",
    steel: "#B8B8D0", dark: "#705848"
};

async function loadPokedex() {
    try {
        const response = await fetch('./pokedex.csv');
        const data = await response.text();
        const rows = data.trim().split('\n');

        for (let i = 1; i < rows.length; i++) {
            const cols = rows[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (cols.length < 13) continue;

            const cleanNum = val => Number(val.replace(/"/g, '').trim());
            const cleanStr = val => val.replace(/"/g, '').trim();
            const typeString = cols[10].replace(/[{}" ]/g, '');
            const cleanTypes = typeString.split(/[;,]/);

            pokemonData.push({
                id: cleanStr(cols[0]),
                name: cleanStr(cols[1]),
                hp: cleanNum(cols[4]),
                attack: cleanNum(cols[5]),
                defense: cleanNum(cols[6]),
                sp_atk: cleanNum(cols[7]),
                sp_def: cleanNum(cols[8]),
                speed: cleanNum(cols[9]),
                type1: cleanTypes[0]?.toLowerCase() || 'normal',
                type2: cleanTypes[1]?.toLowerCase() || '',
                description: cleanStr(cols[12])
            });
        }
        document.getElementById("loading-spinner").style.display = "none";
        searchPokemon();

    } catch (err) {
        console.error("CSV Loading Error:", err);
    }
}


function searchPokemon() {
    const start = document.getElementById("start").value.toLowerCase();
    const include = document.getElementById("include").value.toLowerCase();
    const exclude = document.getElementById("exclude").value.toLowerCase();
    const length = parseInt(document.getElementById("length").value);
    const position = document.getElementById("position")?.value.toLowerCase().trim() || "";
    const typeFilter = document.getElementById("type-filter").value.toLowerCase();
    const sortStat = document.getElementById("sort-stat").value;

    const typeSelect = document.getElementById("type-filter");
    if (typeFilter && typeColors[typeFilter]) {
        typeSelect.style.backgroundColor = typeColors[typeFilter];
        typeSelect.style.color = "white";
    } else {
        typeSelect.style.backgroundColor = "white";
        typeSelect.style.color = "black";
    }

    let filtered = pokemonData.filter(p => {
        const n = p.name.toLowerCase();
        if (length && n.length !== length) return false;
        if (start && !n.startsWith(start)) return false;

        if (include) {
            for (let c of include) if (!n.includes(c)) return false;
        }

        if (exclude) {
            const excludedChars = exclude.split(',').map(c => c.trim()).filter(Boolean);
            for (let c of excludedChars) if (n.includes(c)) return false;
        }

        if (position) {
            const posLetters = position.split('');
            for (let i = 0; i < posLetters.length; i++) {
                if (posLetters[i] !== '_' && p.name[i]?.toLowerCase() !== posLetters[i]) return false;
            }
        }

        if (typeFilter && p.type1 !== typeFilter && p.type2 !== typeFilter) return false;

        return true;
    });

    filtered.sort((a, b) => {
        if (sortStat === "name") return a.name.localeCompare(b.name);
        if (sortStat === "id") return parseInt(a.id) - parseInt(b.id);
        return b[sortStat] - a[sortStat];
    });

    document.getElementById("count-text").innerText = `Found ${filtered.length} Pokémon`;
    renderResults(filtered);
}

function renderResults(list) {
    const results = document.getElementById("results");
    results.innerHTML = list.map(p => {
        const color = typeColors[p.type1] || "#777";
        return `
            <li class="pokemon-card" style="border-bottom-color:${color}" onclick="openModal('${p.id}')">
                <div class="sprite-container"><img src="./pokemon-images/${p.id}.png" onerror="this.src='./pokemon-images/0.png'" loading="lazy"></div>
                <div>
                    <span style="font-weight:900; display:block; text-transform:capitalize; color:#222;">#${p.id} ${p.name}</span>
                    <span class="type-badge" style="background:${color}">${p.type1}</span>
                    ${p.type2 ? `<span class="type-badge" style="background:${typeColors[p.type2]}">${p.type2}</span>` : ''}
                </div>
            </li>
        `;
    }).join('');
}

function openModal(id) {
    const p = pokemonData.find(x => x.id == id);
    if (!p) return;

    const color = typeColors[p.type1] || "#777";
    const body = document.getElementById("modal-body");
    const total = p.hp + p.attack + p.defense + p.sp_atk + p.sp_def + p.speed;

    body.style.border = `8px solid ${color}`;
    body.style.background = `linear-gradient(180deg, #ffffff 60%, ${color}22 100%)`;

    body.innerHTML = `
        <button class="modal-close" onclick="closeModal()" style="
            position:absolute; top:10px; right:10px;
            background:${color}; color:white; border:none; border-radius:50%;
            width:30px; height:30px; font-weight:bold; font-size:18px; cursor:pointer;
        ">×</button>
        <img src="./pokemon-images/${p.id}.png" onerror="this.src='./pokemon-images/0.png'">
        <h2 style="color:${color}; text-transform:capitalize; margin: 15px 0 5px;">${p.name}</h2>
        <p style="font-size:0.85rem; color:#555; border-left: 5px solid ${color}; padding: 10px; background:#f5f5f5; border-radius:0 10px 10px 0; text-align:left; line-height:1.4;">
            "${p.description}"
        </p>
        <div class="stats-box">
            ${renderStat('💖', p.hp, 255, color)}
            ${renderStat('🗡️', p.attack, 190, color)}
            ${renderStat('🛡️', p.defense, 230, color)}
            ${renderStat('🔮', p.sp_atk, 194, color)}
            ${renderStat('🛡️', p.sp_def, 230, color)}
            ${renderStat('⚡', p.speed, 180, color)}
            <div style="text-align:right; font-weight:900; color:${color}; margin-top:12px; font-size:1rem;">BST: ${total}</div>
        </div>
    `;

    document.getElementById("pokeModal").style.display = "flex";
}

function renderStat(label, val, max, color) {
    const percent = Math.min((val / max) * 100, 100);
    const displayPercent = Math.max(percent, 5);
    return `
        <div class="stat-row">
            <div class="stat-label">${label}</div>
            <div style="width:35px; font-weight:bold; font-size:0.8rem;">${val}</div>
            <div class="stat-bar-container"><div class="stat-bar-fill" style="width:${displayPercent}%; background:${color}"></div></div>
        </div>
    `;
}

function closeModal() { document.getElementById("pokeModal").style.display = "none"; }

function clearFilters() {
    document.querySelectorAll('input').forEach(i => i.value = '');
    const tSelect = document.getElementById("type-filter");
    tSelect.value = ""; tSelect.style.backgroundColor = "white"; tSelect.style.color = "black";
    document.getElementById("sort-stat").value = "id";
    searchPokemon();
}

loadPokedex();
