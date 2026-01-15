let pokemonData = [];

const typeColors = {
    grass: "#78C850", fire: "#F08030", water: "#6890F0", bug: "#A8B820",
    normal: "#A8A878", poison: "#A040A0", electric: "#F8D030", ground: "#E0C068",
    fairy: "#EE99AC", fighting: "#C03028", psychic: "#F85888", rock: "#B8A038",
    ghost: "#705898", ice: "#98D8D8", dragon: "#7038F8", flying: "#A890F0",
    steel: "#B8B8D0", dark: "#705848"
};

async function loadPokedex() {
    const res = await fetch("./pokedex.csv");
    const text = await res.text();
    const rows = text.trim().split("\n");

    for (let i = 1; i < rows.length; i++) {
        const c = rows[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        const t = c[10].replace(/[{}" ]/g, "").split(/[;,]/);
        pokemonData.push({
            id: c[0].replace(/"/g,""),
            name: c[1].replace(/"/g,""),
            hp: +c[4], attack: +c[5], defense: +c[6],
            sp_atk: +c[7], sp_def: +c[8], speed: +c[9],
            type1: t[0]?.toLowerCase() || "normal",
            type2: t[1]?.toLowerCase() || "",
            description: c[12].replace(/"/g,"")
        });
    }
    document.getElementById("loading-spinner").style.display = "none";
    searchPokemon();
}

function searchPokemon() {
    const start = startInput().value;
    const include = includeInput().value;
    const exclude = excludeInput().value;
    const length = +lengthInput().value;
    const type = typeSelect().value;
    const sort = sortSelect().value;

    let list = pokemonData.filter(p => {
        const n = p.name.toLowerCase();
        if (length && n.length !== length) return false;
        if (start && !n.startsWith(start)) return false;
        if (include) {
            for (let c of include) {
                if (!n.includes(c)) return false;
      } 
         }
        if (exclude) {
            for (let c of exclude.split(",").map(x => x.trim())) {
                if (c && n.includes(c)) return false;
            }
        }
        if (type && p.type1 !== type && p.type2 !== type) return false;
        return true;
    });

    list.sort((a,b) => {
        if (sort === "name") return a.name.localeCompare(b.name);
        if (sort === "id") return a.id - b.id;
        return b[sort] - a[sort];
    });

    document.getElementById("count-text").innerText = `Found ${list.length} Pokémon`;
    renderResults(list);
}

function renderResults(list) {
    document.getElementById("results").innerHTML = list.map(p => `
        <li class="pokemon-card" style="border-bottom-color:${typeColors[p.type1]}" onclick="openModal('${p.id}')">
            <div class="sprite-container">
                <img src="./pokemon-images/${p.id}.png" onerror="this.src='./pokemon-images/0.png'">
            </div>
            <div>
                <strong>#${p.id} ${p.name}</strong><br>
                <span class="type-badge" style="background:${typeColors[p.type1]}">${p.type1}</span>
                ${p.type2 ? `<span class="type-badge" style="background:${typeColors[p.type2]}">${p.type2}</span>` : ""}
            </div>
        </li>
    `).join("");
}

function openModal(id) {
    const p = pokemonData.find(x => x.id == id);
    const c = typeColors[p.type1];
    document.getElementById("modal-body").innerHTML = `
        <img src="./pokemon-images/${p.id}.png">
        <h2 style="color:${c}">${p.name}</h2>
        <p>${p.description}</p>
    `;
    document.getElementById("pokeModal").style.display = "flex";
}

function closeModal() {
    document.getElementById("pokeModal").style.display = "none";
}

function clearFilters() {
    document.querySelectorAll("input").forEach(i => i.value = "");
    typeSelect().value = "";
    sortSelect().value = "id";
    searchPokemon();
}

const startInput = () => document.getElementById("start");
const includeInput = () => document.getElementById("include");
const excludeInput = () => document.getElementById("exclude");
const lengthInput = () => document.getElementById("length");
const typeSelect = () => document.getElementById("type-filter");
const sortSelect = () => document.getElementById("sort-stat");

loadPokedex();
