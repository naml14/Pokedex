const url = 'https://pokeapi.co/api/v2/pokemon';
const placeholder = 'https://fakemonday.woodenplankstudios.com/wp-content/uploads/2022/10/pokemon_placeholder.jpg'

const d = document;
const $grid = d.getElementById("grid");
const $card = d.getElementById("card");
const $boton = d.getElementById("boton-buscar");
const $texto = d.getElementById("texto-buscar");
const $modal = d.getElementById("exampleModal");
let $prevButton, $nextButton, $pageIndicator; // Declare pagination elements
$card.className = "card visually-hidden"

class pokemon {
    constructor(id, nombre, tipo, imagen, altura, peso, habilidades) {
        this.id = id;
        this.nombre = nombre;
        this.tipo = tipo;
        this.imagen = imagen;
        this.altura = altura;
        this.peso = peso;
        this.habilidades = habilidades;
    }
}

let pokemones = []; // Stores all fetched Pokémon for search functionality
let totalPokemonCount = 0;
let currentPage = 1;
const POKEMON_PER_PAGE = 9;

async function fetchPokemonBatch(offset, limit) {
    const pokemonPromises = [];
    // Loop from 1 to limit to fetch 'limit' number of Pokemon
    for (let i = 1; i <= limit; i++) {
        const pokemonIdToFetch = offset + i;
        // Stop if we are trying to fetch beyond the total number of pokemon
        if (totalPokemonCount > 0 && pokemonIdToFetch > totalPokemonCount) {
            console.log(`Stopping fetch: Attempting to fetch ID ${pokemonIdToFetch} but total count is ${totalPokemonCount}`);
            break;
        }
        const pokemonUrl = `${url}/${pokemonIdToFetch}`;
        pokemonPromises.push(
            fetch(pokemonUrl)
                .then(response => {
                    if (!response.ok) {
                        // It's possible some IDs might not exist or fail, log and continue
                        console.warn(`Failed to fetch ${pokemonUrl}: ${response.statusText}. Skipping this Pokémon.`);
                        return null; // Return null for failed fetches to handle in Promise.all
                    }
                    return response.json();
                })
                .catch(error => {
                    console.warn(`Error during fetch for ${pokemonUrl}: ${error}. Skipping this Pokémon.`);
                    return null; // Return null for caught errors
                })
        );
    }

    try {
        const results = await Promise.all(pokemonPromises);
        const currentBatch = [];
        results.forEach(data => {
            // Process data only if it's not null (i.e., fetch was successful and returned valid JSON)
            if (data && data.id) { 
                const newPokemon = new pokemon(
                    data.id,
                    data.name,
                    data.types,
                    data.sprites.other["official-artwork"].front_default !== null ? data.sprites.other["official-artwork"].front_default : placeholder,
                    data.height,
                    data.weight,
                    data.abilities
                );
                // Add to global list for search if not already present
                if (!pokemones.some(p => p.id === newPokemon.id)) {
                    pokemones.push(newPokemon);
                }
                currentBatch.push(newPokemon);
            }
        });
        // Sort global pokemones array by ID for consistency in search, though search itself doesn't strictly require it.
        pokemones.sort((a,b) => a.id - b.id); 
        console.log('Fetched batch for current page:', currentBatch);
        return currentBatch; // Return only the current batch
    } catch (error) {
        // This catch block might be redundant if individual fetches handle their errors,
        // but it's a good fallback for Promise.all itself failing.
        console.error("Error processing Pokémon batch results:", error);
        return []; // Return empty array on error
    }
}

async function initializeApp() {
    try {
        const response = await fetch(url); 
        if (!response.ok) {
            throw new Error(`Failed to fetch initial Pokémon data: ${response.statusText}`);
        }
        const data = await response.json();
        // totalPokemonCount = data.count; // This count includes many alternate forms, etc.
        totalPokemonCount = 1025; // Using a more common limit for "standard" Pokémon
        console.log(`Total Pokémon count set to: ${totalPokemonCount} (originally ${data.count} from API)`);
        
        // Get references to pagination elements
        $prevButton = d.getElementById("prev-button");
        $nextButton = d.getElementById("next-button");
        $pageIndicator = d.getElementById("page-indicator");

        // Add event listeners
        $prevButton.addEventListener("click", async () => {
            if (!$prevButton.disabled) { // Check if button is not disabled
                await displayPokemonPage(currentPage - 1);
            }
        });

        $nextButton.addEventListener("click", async () => {
            if (!$nextButton.disabled) { // Check if button is not disabled
                await displayPokemonPage(currentPage + 1);
            }
        });
        
        await displayPokemonPage(currentPage); // Load initial page
        // updatePageIndicator(); // Initial update after first page load - displayPokemonPage will call it
    } catch (error) {
        console.error("Error initializing app:", error);
        $grid.innerHTML = "<p>Error loading Pokémon data. Please try refreshing the page.</p>";
        // If app init fails, still try to set up indicator and buttons to a safe state
        if ($pageIndicator) $pageIndicator.textContent = "Error loading";
        if ($prevButton) $prevButton.disabled = true;
        if ($nextButton) $nextButton.disabled = true;
    }
}

function updatePageIndicator() {
    if (!$pageIndicator || !$prevButton || !$nextButton) {
        console.warn("Pagination UI elements not found. Skipping indicator update.");
        return;
    }

    const totalPages = Math.ceil(totalPokemonCount / POKEMON_PER_PAGE);

    if (totalPokemonCount === 0) { // Handles case where no pokemon are loaded/found
        $pageIndicator.textContent = "No Pokémon found";
        $prevButton.disabled = true;
        $nextButton.disabled = true;
        return;
    }
    
    $pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`;
    $prevButton.disabled = currentPage === 1;
    $nextButton.disabled = currentPage === totalPages;
}

async function displayPokemonPage(pageNumber) {
    currentPage = pageNumber;
    const offset = (pageNumber - 1) * POKEMON_PER_PAGE;
    
    $grid.innerHTML = ''; // Clear previous Pokémon from the grid
    
    console.log(`Displaying page ${pageNumber}, offset ${offset}`);
    const pokemonBatch = await fetchPokemonBatch(offset, POKEMON_PER_PAGE);
    
    if (pokemonBatch && pokemonBatch.length > 0) {
        displayPokemons(pokemonBatch);
    } else if (offset >= totalPokemonCount && totalPokemonCount > 0) {
        $grid.innerHTML = "<p>No more Pokémon to display.</p>";
    } else if (!pokemonBatch || pokemonBatch.length === 0 && totalPokemonCount > 0) {
        $grid.innerHTML = "<p>Could not load Pokémon for this page. Please check console for errors or try a different page.</p>";
    } else { // Handles the case where totalPokemonCount might be 0 initially or after an error
         $grid.innerHTML = "<p>No Pokémon available to display.</p>";
    }
    updatePageIndicator(); // Update after page content is set
}

function displayPokemons(pokemonArray) {
    // The batch should already be in order from fetchPokemonBatch due to ordered URL creation
    // and Promise.all preserving order of resolved promises.
    // Sorting here is a fallback, not strictly necessary if fetchPokemonBatch is reliable.
    // pokemonArray.sort((a, b) => a.id - b.id); 

    pokemonArray.forEach((poke) => {
        if (!poke || typeof poke.id === 'undefined') {
            console.warn("Skipping display for invalid Pokémon data:", poke);
            return; // Skip if poke is null or id is missing
        }
        let $newCard = $card.cloneNode(true);
        $newCard.className = "col";
        $newCard.id = `card-${poke.id}`; // Use a simple unique ID for the card container
        $newCard.children[0].id = poke.id; // This ID is used by modificarModal
        $newCard.children[0].children[0].src = poke.imagen;
        $newCard.children[0].children[0].alt = poke.nombre;
        $newCard.children[0].children[1].children[0].innerHTML = `N°${poke.id} ${poke.nombre}`;
        let tipos = "";
        for (let j = 0; j < poke.tipo.length; j++) {
            tipos += `${poke.tipo[j].type.name} `;
        }
        $newCard.children[0].children[1].children[1].innerHTML = tipos;
        $grid.appendChild($newCard);
    });
}

// Initialize the application
initializeApp();

$boton.onclick = async () => {
    const pokemonName = $texto.value.trim().toLowerCase();

    if (!pokemonName) {
        alert("Please enter a Pokémon name to search.");
        return;
    }

    const searchUrl = `${url}/${pokemonName}`; // `url` is already 'https://pokeapi.co/api/v2/pokemon'

    try {
        const response = await fetch(searchUrl);
        if (response.ok) {
            const data = await response.json();

            // Create a pokemon object using the class constructor
            const searchedPokemon = new pokemon(
                data.id,
                data.name,
                data.types,
                data.sprites.other["official-artwork"].front_default !== null ? data.sprites.other["official-artwork"].front_default : placeholder,
                data.height,
                data.weight,
                data.abilities
            );

            // Populate and show the modal (adapted from existing modal logic)
            let tipos = "";
            for (let i = 0; i < searchedPokemon.tipo.length; i++) {
                tipos += `${searchedPokemon.tipo[i].type.name} `;
            }
            let habilidades = "";
            for (let i = 0; i < searchedPokemon.habilidades.length; i++) {
                if (searchedPokemon.habilidades[i].is_hidden) {
                    habilidades += `${searchedPokemon.habilidades[i].ability.name}(Habilidad Oculta) `;
                } else {
                    habilidades += `${searchedPokemon.habilidades[i].ability.name} `;
                }
            }
            $modal.children[0].children[0].children[0].children[0].innerHTML = searchedPokemon.nombre; // Modal Title
            $modal.children[0].children[0].children[1].innerHTML = `
                N°${searchedPokemon.id}
                <img class="card-img-top g-0" src="${searchedPokemon.imagen}" alt="${searchedPokemon.nombre}">
                    Tipo: ${tipos}<br>
                    Altura: ${(searchedPokemon.altura) / 10} m<br>
                    Peso: ${(searchedPokemon.peso) / 10} Kg<br>
                    Habilidades: ${habilidades}<br>`;
            
            let modalInstance = bootstrap.Modal.getInstance($modal);
            if (!modalInstance) {
                modalInstance = new bootstrap.Modal($modal);
            }
            modalInstance.show();

        } else {
            // Handle cases like 404 Not Found
            alert("Error, No se encontró ningún pokémon con ese nombre");
        }
    } catch (error) {
        console.error("Error fetching Pokémon by name:", error);
        alert("An error occurred while searching for the Pokémon. Please try again.");
    }
}

async function modificarModal(e) {
    // The 'e' parameter is the clicked card's 'a' tag. The ID of the Pokemon was set on this 'a' tag.
    const pokemonId = parseInt(e.id); 
    const pokemonToShow = pokemones.find(p => p.id === pokemonId);

    if (!pokemonToShow) {
        console.error(`Pokémon with ID ${pokemonId} not found in the loaded list for modal.`);
        // Optionally, display an error in the modal
        $modal.children[0].children[0].children[0].children[0].innerHTML = "Error";
        $modal.children[0].children[0].children[1].innerHTML = "Could not find Pokémon details.";
        return;
    }

    let tipos = "";
    for (let i = 0; i < pokemonToShow.tipo.length; i++) {
        tipos += `${pokemonToShow.tipo[i].type.name} `;
    }
    let habilidades = "";
    for (let i = 0; i < pokemonToShow.habilidades.length; i++) {
        if (pokemonToShow.habilidades[i].is_hidden) {
            habilidades += `${pokemonToShow.habilidades[i].ability.name} (Habilidad Oculta) `;
        } else {
            habilidades += `${pokemonToShow.habilidades[i].ability.name} `;
        }
    }
    $modal.children[0].children[0].children[0].children[0].innerHTML = pokemonToShow.nombre;
    $modal.children[0].children[0].children[1].innerHTML = `
        N°${pokemonToShow.id}
        <img class="card-img-top g-0" src="${pokemonToShow.imagen}" alt="${pokemonToShow.nombre}">
            tipo: ${tipos}<br>
            altura: ${(pokemonToShow.altura) / 10} m<br>
            peso: ${(pokemonToShow.peso) / 10} Kg<br>
            habilidades: ${habilidades}<br>`;
}
