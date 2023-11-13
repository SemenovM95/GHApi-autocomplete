import { debounce } from "./js/utils.js";
import gitHubApi from "./js/githubApi.js";

async function getRepos(query) {
  return await gitHubApi.getReposByName(query);
}

function reactive(obj) {
  return new Proxy(obj, {
    get(target, prop) {
      return target[prop];
    },
    set(target, prop, value) {
      target[prop] = value;
      renderResults();
      hideAutocomplete();
      return true;
    },
  });
}

let selected = [];
let reactiveSelected = reactive(selected);
let latestLoaded;

const searchInput = document.querySelector(".search__input");
const dropdownContainer = document.querySelector(".search__autocomplete");
const resultsContainer = document.querySelector(".results");

searchInput.oninput = debounce((event) => {
  const query = event.target.value;
  if (query.length) {
    getRepos(query)
      .then((res) => {
        res.items.length ? (latestLoaded = res.items) : (latestLoaded = []);
        showAutocomplete();
      })
      .catch((err) => {
        hideAutocomplete();
        console.error(err);
      });
  } else hideAutocomplete();
}, 300);

dropdownContainer.onclick = (event) => {
  if (event.target.classList.contains("autocomplete__item")) {
    const item = latestLoaded.find((el) => el.id == event.target.dataset.id);
    !reactiveSelected.find((el) => el.id == item.id) && reactiveSelected.push(item);
    resetInput();
  }
};

resultsContainer.onclick = (event) => {
  if (event.target.classList.contains("results__button-delete")) {
    reactiveSelected = reactiveSelected.filter(
      (item) => item.id != event.target.parentElement.dataset.id
    );
    renderResults();
  }
};

function showAutocomplete() {
  if (!latestLoaded.length) {
    dropdownContainer.innerHTML = "Nothing found";
    return;
  }
  function createAutocompleteItem(data) {
    const item = document.createElement("span");
    item.classList.add("autocomplete__item");
    item.textContent = data.name;
    item.setAttribute("href", data.html_url);
    item.dataset.id = data.id;
    return item;
  }
  dropdownContainer.innerHTML = "";
  dropdownContainer.classList.remove("search__autocomplete--hidden");
  const options = latestLoaded.map((result) => createAutocompleteItem(result));
  const list = document.createDocumentFragment();
  options.forEach((option) => list.appendChild(option));
  dropdownContainer.appendChild(list);
}

function hideAutocomplete() {
  dropdownContainer.classList.add("search__autocomplete--hidden");
  dropdownContainer.innerHTML = "";
}

function resetInput() {
  searchInput.value = "";
  hideAutocomplete();
}

function renderResults() {
  function createResultsItem(data) {
    return `
      <div class="results__item" data-id="${data.id}">
        <div class="results__description">
          <div class="results__propetry">Name: ${data.name}</div>
          <div class="results__propetry">Owner: ${data.owner.login}</div>
          <div class="results__propetry">Stars: ${data.stargazers_count}</div>
        </div>
        <button class="results__button results__button-delete">
        </button>
      </div>
    `;
  }
  if (!reactiveSelected.length) {
    resultsContainer.innerHTML = "No repos selected";
    return;
  }
  resultsContainer.innerHTML = reactiveSelected
    .map((result) => createResultsItem(result))
    .join("");
}
