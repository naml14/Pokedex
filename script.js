const url = 'https://pokeapi.co/api/v2/pokemon';

const d = document;
const $grid = d.getElementById("grid");
const $card = d.getElementById("card");
const $boton = d.getElementById("boton-buscar");
const $texto = d.getElementById("texto-buscar");
const $modal = d.getElementById("exampleModal");
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

let pokemones = [];

fetch(url).then(response => response.json()).then(data => buscarPokes(data));

function buscarPokes(data) {
    let totalPokes = data.count - 275;
    for (let i = 0; i < totalPokes; i++) {
        let urlPoke = `${url}/${(i + 1)}`;
        setTimeout(() => {
            fetch(urlPoke)
                .then(response => response.json())
                .then(data => {
                    const newPokemon = new pokemon(data.id, data.name, data.types, data.sprites, data.height, data.weight, data.abilities);
                    pokemones.push(newPokemon);
                })
                .then(() => {
                    let $newCard = $card.cloneNode(true);
                    $newCard.className = "col";
                    $newCard.id = `${pokemones[i].id}${pokemones[i].nombre}`;
                    $newCard.children[0].id = pokemones[i].id;
                    $newCard.children[0].children[0].src = pokemones[i].imagen.other["official-artwork"].front_default;
                    $newCard.children[0].children[0].alt = pokemones[i].nombre;
                    $newCard.children[0].children[1].children[0].innerHTML = `N°${pokemones[i].id} ${pokemones[i].nombre}`;
                    let tipos = "";
                    for (let j = 0; j < pokemones[i].tipo.length; j++) {
                        tipos += `${pokemones[i].tipo[j].type.name} `;
                    }
                    $newCard.children[0].children[1].children[1].innerHTML = tipos;
                    $grid.appendChild($newCard);
                });
        }, i * 10);
    }
}

$boton.onclick = async () => {
    let err = true;
    pokemones.forEach(element => {
        if ($texto.value === element.nombre) {
            let shModal = new bootstrap.Modal($modal);
            let tipos = "";
            for (let i = 0; i < element.tipo.length; i++) {
                tipos += `${element.tipo[i].type.name} `;
            }
            let habilidades = "";
            for (let i = 0; i < element.habilidades.length; i++) {
                if (element.habilidades[i].is_hidden) {
                    habilidades += `${element.habilidades[i].ability.name}(Habilidad Oculta) `;
                } else {
                    habilidades += `${element.habilidades[i].ability.name} `;
                }
            }
            $modal.children[0].children[0].children[0].children[0].innerHTML = element.nombre;
            $modal.children[0].children[0].children[1].innerHTML = `
                N°${element.id}
                <img class="card-img-top g-0" src="${element.imagen.other["official-artwork"].front_default}" alt="${element.nombre}">
                    tipo: ${tipos}<br>
                    altura: ${(element.altura) / 10} m<br>
                    peso: ${(element.peso) / 10} Kg<br>
                    habilidades: ${habilidades}<br>`;
            shModal.show();
            err = false;
        }
    })
    if (err) {
        alert("Error, No se encontrón ningun pokémon con ese nombre");
    }
}

async function modificarModal(e) {
    let index = (e.id) - 1;
    let tipos = "";
    for (let i = 0; i < pokemones[index].tipo.length; i++) {
        tipos += `${pokemones[index].tipo[i].type.name} `;
    }
    let habilidades = "";
    for (let i = 0; i < pokemones[index].habilidades.length; i++) {
        if (pokemones[index].habilidades[i].is_hidden) {
            habilidades += `${pokemones[index].habilidades[i].ability.name} (Habilidad Oculta)`;
        } else {
            habilidades += `${pokemones[index].habilidades[i].ability.name} `;
        }
    }
    $modal.children[0].children[0].children[0].children[0].innerHTML = pokemones[index].nombre;
    $modal.children[0].children[0].children[1].innerHTML = `
        N°${pokemones[index].id}
        <img class="card-img-top g-0" src="${pokemones[index].imagen.other["official-artwork"].front_default}" alt="${pokemones[index].nombre}">
            tipo: ${tipos}<br>
            altura: ${(pokemones[index].altura) / 10} m<br>
            peso: ${(pokemones[index].peso) / 10} Kg<br>
            habilidades: ${habilidades}<br>`;
}