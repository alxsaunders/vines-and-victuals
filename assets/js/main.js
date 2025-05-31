const search = document.getElementById('search')
const searchButton = document.getElementById('searchButton')
const food = document.getElementById('food')
const drink = document.getElementById('drink')
const saveButton = document.getElementById('save-button')
const iconButton = document.getElementById('icon')
const hideclass = document.querySelector('.hideclass')
const closebutton = document.getElementById('closebutton')
let url = 'https://cocktails3.p.rapidapi.com/random'
let searchResult
var page = 'assets/html/results.html' 
var path = window.location.pathname
let arrayStatusForFood = true
let arrayStatusForDrink = true
var options = {
	method: 'GET',
	headers: {
		'X-RapidAPI-Key': '7b8cbe350bmshb9cd64af44df572p113944jsneb41b6d60cc0',
		'X-RapidAPI-Host': 'the-cocktail-db.p.rapidapi.com'
	}
}

// Initialize localStorage if undefined
if (localStorage.searchQuery === undefined) {
	localStorage.searchQuery = 'food'
}

// Set placeholder based on search type
if(localStorage.searchQuery === 'food') {
	search.setAttribute('placeholder', 'Enter a food (i.e., sandwich, steak, peppers, tacos)')
} else {
	search.setAttribute('placeholder', 'Enter a drink (i.e., vodka, gin, whiskey)')
}

// Function used to change search criteria
function settingsChecker(e) {
	e.preventDefault()
	if(food.checked) {
		console.log('Food selected')
		localStorage.searchQuery = 'food'
		search.setAttribute('placeholder', 'Enter a food (i.e., sandwich, steak, peppers, tacos)')
	}

	if(drink.checked) {
		console.log('Drink selected')
		localStorage.searchQuery = 'drink'
		search.setAttribute('placeholder', 'Enter a drink (i.e., vodka, gin, whiskey)')
	}
}

// Event listeners
$('#save-button').on("click", settingsChecker)
$('#searchButton').on("click", move)

// Moves user to results page
function move(e) {
	e.preventDefault()
	localStorage.searchResult = search.value

	if (localStorage.searchQuery === 'food') {
		window.location.assign('assets/html/loader.html') 
	} else if(localStorage.searchQuery === 'drink') {
		window.location.assign('assets/html/loader2.html') 
	}
}

// Function called in results.js to call the Api Fetch
function fetchApi(){
	if (localStorage.searchQuery === 'drink') {
		url = `https://the-cocktail-db.p.rapidapi.com/search.php?s=${localStorage.searchResult}`
		getDrinks()
	} else {
		url = `https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/complexSearch?query=${localStorage.searchResult}&type=main course&addRecipeInformation=true&fillIngredients=true`
		getFood()
	}
}

// Function getDrinks
function getDrinks() {
	fetch(url, options)
	.then(response => response.json())
	.then(function(response){
		console.log('Drinks search response:', response)
		
		// The Cocktail DB returns drinks in the 'drinks' property
		let drinks = response.drinks || [];
		
		if (drinks.length === 0) {
			console.error('No drinks found')
			$('#api-content').html('<p>No drinks found. Try a different search term.</p>')
			return
		}
		
		console.log('Found drinks:', drinks.length)
		
		// Clear previous results
		$('#api-content').empty();
		
		// Display drinks data
		for(var z = 0; z < Math.min(drinks.length, 10); z++) {
			const drink = drinks[z];
			const drinkName = drink.strDrink || 'Unknown Drink';
			const drinkId = drink.idDrink;
			
			// Create link container
			$('<a>', {
				href: './single.html?type=drink&name=' + encodeURIComponent(drinkName) + '&id=' + drinkId,
				id: z + 'a',
				class: 'drink-item'
			}).appendTo('#api-content')
			
			// Create drink container
			$('<div>', {
				id: 'drink-' + z,
				class: 'drink-container'
			}).appendTo('#' + z + 'a')
			
			// Add drink name
			$('<h2>',{
				class: 'drink-name'
			}).appendTo('#drink-' + z).text(drinkName)
			
			// Create ingredients list container
			$('<ul>', {
				id: 'ingredientList' + z,
				class: 'ingredient-list'
			}).appendTo("#drink-" + z)

			// Extract ingredients from strIngredient1, strIngredient2, etc.
			let ingredients = [];
			for(let i = 1; i <= 15; i++) {
				const ingredient = drink[`strIngredient${i}`];
				const measure = drink[`strMeasure${i}`];
				if (ingredient && ingredient.trim()) {
					const fullIngredient = measure && measure.trim() ? `${measure.trim()} ${ingredient.trim()}` : ingredient.trim();
					ingredients.push(ingredient.trim()); // Store just the ingredient name for searching
					$('<li>').appendTo('#ingredientList' + z).text(fullIngredient)
				}
			}
			
			if (ingredients.length === 0) {
				$('<li>').appendTo('#ingredientList' + z).text('No ingredients listed')
			}
		}
		
		// Start the food pairing search with the first drink
		if (drinks.length > 0) {
			const firstDrink = drinks[0];
			let ingredients = [];
			
			// Extract ingredients for food pairing
			for(let i = 1; i <= 15; i++) {
				const ingredient = firstDrink[`strIngredient${i}`];
				if (ingredient && ingredient.trim()) {
					ingredients.push(ingredient.trim());
				}
			}
			
			if (ingredients.length > 0) {
				loopArray(0, ingredients)
			}
		}
		
		// Function to find food pairings based on drink ingredients
		function loopArray(index, ingredients) {
			if (index >= ingredients.length) {
				console.log('Finished searching for food pairings')
				return
			}
			
			const ingredient = ingredients[index]
			const newUrl = `https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/complexSearch?includeIngredients=${encodeURIComponent(ingredient)}&type=main course&addRecipeInformation=true`
			
			// Use different headers for Spoonacular API
			const foodOptions = {
				method: 'GET',
				headers: {
					'X-RapidAPI-Key': '7b8cbe350bmshb9cd64af44df572p113944jsneb41b6d60cc0',
					'X-RapidAPI-Host': 'spoonacular-recipe-food-nutrition-v1.p.rapidapi.com'
				}
			}
			
			if(arrayStatusForFood === true) {
				getFoodByIngredients(newUrl, foodOptions, index, ingredients)
			}
		}
		
		// Function getFoodByIngredients
		function getFoodByIngredients(newUrl, foodOptions, currentIndex, ingredients) {
			fetch(newUrl, foodOptions)
			.then(response => response.json())
			.then(function(response) {
				if(response.results && response.results.length === 0) {
					console.log('No food found for ingredient: ' + ingredients[currentIndex])
					// Try next ingredient
					loopArray(currentIndex + 1, ingredients)
				} else if (response.results && response.results.length > 0) {
					console.log('Found food pairings:', response.results)
					arrayStatusForFood = false
					// You can add code here to display the food pairings
				}
			})
			.catch(error => {
				console.error('Error fetching food by ingredients:', error)
				loopArray(currentIndex + 1, ingredients)
			})
		}
	})
	.catch(error => {
		console.error('Error fetching drinks:', error)
		$('#api-content').html('<p>Error searching for drinks. Please try again.</p>')
	})
}

// Function getFood
function getFood() {
	// Use proper headers for Spoonacular API
	const foodOptions = {
		method: 'GET',
		headers: {
			'X-RapidAPI-Key': '7b8cbe350bmshb9cd64af44df572p113944jsneb41b6d60cc0',
			'X-RapidAPI-Host': 'spoonacular-recipe-food-nutrition-v1.p.rapidapi.com'
		}
	}
	
	fetch(url, foodOptions)
	.then(response => response.json())
	.then(function(response){
		console.log(url)
		console.log(response)
		
		// Check if response has valid data
		if (!response.results || response.results.length === 0) {
			console.error('No food found')
			return
		}
		
		let ingredient;
		var i = 0;

		// Display food data
		for(var z = 0; z < response.results.length; z++) {
			// Create link container
			$('<a>', {
				href: './single.html?type=food&name=' + encodeURIComponent(response.results[z].title) + '&id=' + response.results[z].id,
				id: z + 'a',
				class: 'food-item'
			}).appendTo('#api-content')
			
			// Create food container
			$('<div>', {
				id: 'food-' + z,
				class: 'food-container'
			}).appendTo('#' + z + 'a')
			
			// Add food name
			$('<h2>',{
				class: 'food-name'
			}).appendTo('#food-' + z).text(response.results[z].title)
			
			// Create ingredients list container
			$('<ul>', {
				id: 'ingredientList' + z,
				class: 'ingredient-list'
			}).appendTo("#food-" + z)
			
			// Add ingredients if available
			if (response.results[z].extendedIngredients) {
				for(var index = 0; index < response.results[z].extendedIngredients.length; index++) {
					$('<li>').appendTo('#ingredientList' + z).text(response.results[z].extendedIngredients[index].original)
				}
			}
		}
		
		// Start the drink pairing search
		if (response.results.length > 0 && response.results[0].extendedIngredients && response.results[0].extendedIngredients.length > 0) {
			loopArrayD(0)
		}
		
		// Function to find drink pairings based on food ingredients
		function loopArrayD(index) {
			if (!response.results[0].extendedIngredients || index >= response.results[0].extendedIngredients.length) {
				console.log('Finished searching for drink pairings')
				return
			}
			
			ingredient = response.results[0].extendedIngredients[index].name
			newUrl = `https://the-cocktail-db.p.rapidapi.com/filter.php?i=${encodeURIComponent(ingredient)}`
			
			if(arrayStatusForDrink === true) {
				getDrinksByIngredients(newUrl, options, index)
			}
		}

		// Function getDrinksByIngredients
		function getDrinksByIngredients(newUrl, options, currentIndex) {
			fetch(newUrl, options)
			.then(response => response.json())
			.then(function(response) {
				if(!response.drinks || response.drinks.length === 0) {
					console.log('No drinks found for ingredient: ' + response.results[0].extendedIngredients[currentIndex].name)
					// Try next ingredient
					loopArrayD(currentIndex + 1)
				} else {
					console.log('Found drink pairings:', response.drinks)
					arrayStatusForDrink = false
					// You can add code here to display the drink pairings
				}
			})
			.catch(error => {
				console.error('Error fetching drinks by ingredients:', error)
				loopArrayD(currentIndex + 1)
			})
		}
	})
	.catch(error => {
		console.error('Error fetching food:', error)
	})
}

// Modal functions
if (iconButton) {
	iconButton.addEventListener("click", opendevs)
}

function opendevs() {
	if (hideclass) {
		hideclass.classList.remove("hideclass")
	}
}

if (closebutton) {
	closebutton.addEventListener("click", closedevs)
}

function closedevs() {
	if (hideclass) {
		hideclass.classList.add("hideclass")
	}
}