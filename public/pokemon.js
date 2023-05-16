const PAGE_SIZE = 10
let currentPage = 1;
let pokemons = []

const updatePaginationDiv = (currentPage, numPages) => {
    $('#pagination').empty()

    // Display a max of 5 pages at a time.
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(startPage + 4, numPages);
    for (let i = startPage; i <= endPage; i++) {
        $('#pagination').append(`
            <button class="btn btn-primary page ml-1 numberedButtons ${i === currentPage ? 'active' : ''}" value="${i}">${i}</button>
        `);
    }

    // Display next and previous buttons.
    const prevButton = `<button class="btn btn-primary page ml-1 prevButton" value="${currentPage - 1}">&lt;</button>`;
    const nextButton = `<button class="btn btn-primary page ml-1 nextButton" value="${currentPage + 1}">&gt;</button>`;
    $('#pagination').prepend(prevButton);
    $('#pagination').append(nextButton);
}

const paginate = async (currentPage, PAGE_SIZE, pokemons) => {
    // Order was randomized in the original code. Modified it to keep that from happening.
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = currentPage * PAGE_SIZE;
    const selected_pokemons = pokemons.slice(start, end);

    // Displays number of Pokemon being displayed
    const totalPokemons = pokemons.length;
    const startPokemon = (currentPage - 1) * PAGE_SIZE + 1;
    const endPokemon = Math.min(currentPage * PAGE_SIZE, totalPokemons);

    $('#pokeStats').text(`Total Pokémons: ${totalPokemons} | Displayed Pokémons: ${startPokemon}-${endPokemon}`);
    // END

    $('#pokeCards').empty();

    for (let i = start; i < end; i++) {
        const pokemon = selected_pokemons[i - start];
        const res = await axios.get(pokemon.url);
        $('#pokeCards').append(`
            <div class="pokeCard card" pokeName=${res.data.name}>
                <h3>${res.data.name.toUpperCase()}</h3> 
                <img src="${res.data.sprites.front_default}" alt="${res.data.name}"/>
                <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#pokeModal">
                    More
                </button>
            </div>  
        `);
    }
    // END

    // Hide next and previous buttons when there is no next or previous page
    if (currentPage === 1) {
        $('.prevButton').hide();
    } else {
        $('.prevButton').show();
    }

    // if (currentPage === numPages)
    if (currentPage === 81) {
        $('.nextButton').hide();
    } else {
        $('.nextButton').show();
    }
    // END
}

// Filters Pokemon based on selected types.
const filterPokemonsByType = () => {
    const selectedTypes = $('.typeCheckbox:checked').map(function () {
        return $(this).attr('id');
    }).get();

    const filteredPokemons = pokemons.filter((pokemon) => {
        return pokemon.types.some((type) => selectedTypes.includes(type.type.name));
    });

    currentPage = 1;
    paginate(currentPage, PAGE_SIZE, filteredPokemons);
    const numPages = Math.ceil(filteredPokemons.length / PAGE_SIZE);
    updatePaginationDiv(currentPage, numPages);
}
// END

const setup = async () => {
    // Fetches Pokemon types
    // Fetch the Pokémon types from the API
    const typesResponse = await axios.get('https://pokeapi.co/api/v2/type');
    const pokemonTypes = typesResponse.data.results;

    // Display the Pokémon types in a checkbox group
    const typeGroup = $('#typeGroup');
    pokemonTypes.forEach((type) => {
        typeGroup.append(`
            <div class="form-check">
                <input class="form-check-input typeCheckbox" type="checkbox" id="${type.name}">
                <label class="form-check-label" for="${type.name}">${type.name}</label>
            </div>
        `);
    });

    // Rest of the code...

    // Add event listener to type checkboxes
    $('body').on('change', '.typeCheckbox', function () {
        filterPokemonsByType();
    });

    // Add event listener to load button
    $('#loadButton').click(function () {
        filterPokemonsByType(); // Call the filterPokemonsByType function
        paginate(currentPage, PAGE_SIZE, pokemons);
        const numPages = Math.ceil(pokemons.length / PAGE_SIZE);
        updatePaginationDiv(currentPage, numPages);
    });
    // END

    // test out poke api using axios here
    $('#pokeCards').empty()
    let response = await axios.get('https://pokeapi.co/api/v2/pokemon?offset=0&limit=810');
    pokemons = response.data.results;

    paginate(currentPage, PAGE_SIZE, pokemons)
    const numPages = Math.ceil(pokemons.length / PAGE_SIZE)
    updatePaginationDiv(currentPage, numPages)

    // pop up modal when clicking on a pokemon card
    // add event listener to each pokemon card
    $('body').on('click', '.pokeCard', async function (e) {
        const pokemonName = $(this).attr('pokeName')
        // console.log("pokemonName: ", pokemonName);
        const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`)
        // console.log("res.data: ", res.data);
        const types = res.data.types.map((type) => type.type.name)
        // console.log("types: ", types);
        $('.modal-body').html(`
        <div style="width:200px">
        <img src="${res.data.sprites.other['official-artwork'].front_default}" alt="${res.data.name}"/>
        <div>
        <h3>Abilities</h3>
        <ul>
        ${res.data.abilities.map((ability) => `<li>${ability.ability.name}</li>`).join('')}
        </ul>
        </div>

        <div>
        <h3>Stats</h3>
        <ul>
        ${res.data.stats.map((stat) => `<li>${stat.stat.name}: ${stat.base_stat}</li>`).join('')}
        </ul>

        </div>

        </div>
          <h3>Types</h3>
          <ul>
          ${types.map((type) => `<li>${type}</li>`).join('')}
          </ul>
      
        `)
        $('.modal-title').html(`
        <h2>${res.data.name.toUpperCase()}</h2>
        <h5>${res.data.id}</h5>
        `)
    })

    const responseTypes = await axios.get('https://pokeapi.co/api/v2/type');
    const types = responseTypes.data.results;
    $('#filters').empty();
    types.forEach((type) => {
        $('#filters').append(`
        <div class="form-check form-check-inline">
            <input class="form-check-input type-filter" type="checkbox" value="${type.name}" id="${type.name}-filter">
            <label class="form-check-label" for="${type.name}-filter">${type.name}</label>
        </div>
    `);
    });

    $('body').on('change', '.type-filter', function () {
        const selectedTypes = [];
        $('.type-filter:checked').each(function () {
            selectedTypes.push($(this).val());
        });
        const filteredPokemons = pokemons.filter((pokemon) => {
            return pokemon.types.some((type) => selectedTypes.includes(type));
        });
        paginate(currentPage, PAGE_SIZE, filteredPokemons);
        const numPages = Math.ceil(filteredPokemons.length / PAGE_SIZE);
        updatePaginationDiv(currentPage, numPages);
    });

    const totalPokemons = pokemons.length;
    $('#pokemonCount').text(`Total Pokémons: ${totalPokemons}`);

    const updatePokemonCount = (currentPage, numPages, pageSize) => {
        const startPokemon = (currentPage - 1) * pageSize + 1;
        const endPokemon = Math.min(currentPage * pageSize, totalPokemons);
        $('#displayedPokemonCount').text(`Displaying Pokémons ${startPokemon} - ${endPokemon} of ${totalPokemons}`);
    };

    updatePokemonCount(currentPage, numPages, PAGE_SIZE);

    $('#goToPageBtn').on('click', goToPage);

    // add event listener to pagination buttons
    $('body').on('click', ".numberedButtons", async function (e) {
        currentPage = Number(e.target.value)
        paginate(currentPage, PAGE_SIZE, pokemons)

        //update pagination buttons
        updatePaginationDiv(currentPage, numPages)
    })
}

const goToPage = () => {
    const numPages = Math.ceil(pokemons.length / PAGE_SIZE);
    const pageInput = prompt(`Enter a page number (1 - ${numPages}):`);
    const pageNumber = parseInt(pageInput);

    if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= numPages) {
        currentPage = pageNumber;
        paginate(currentPage, PAGE_SIZE, pokemons);
        updatePaginationDiv(currentPage, numPages);
    } else {
        alert(`Invalid page number. Please enter a number between 1 and ${numPages}.`);
    }
};

$(document).ready(setup)