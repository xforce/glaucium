let vm = new Vue({
  el: '#app',
  delimiters: ['${', '}'],
  data: {
      states: [
          "Meow",
          "Cookie",
      ],
      products: [],
      versions: [],
      platforms: [],
      selected_products: [],
      selected_versions: [],
      selected_platforms: [],
      e6: [],
      e7: [],
      menu: false,
      menu2: false,
      e3: null,
      e4: null,
      search_result_facet_headers: [ 
        { text: 'Rank', value: 'rank', left: true },
        { text: 'Signature', value: 'signature' },
        { text: 'Count', value: 'count' },
        { text: 'Percentage', value: 'percentage' }
      ],
      search_result_facet_items: [],
  },
  watch: {
    selected_products: (val)=> {
    loadSignatureTable()
    },
    selected_versions: (val)=> {
    loadSignatureTable()
    },
    selected_platforms: (val)=> {
    loadSignatureTable()
    }
  }
})

function loadProducts() {
  let meow = {
        "facets": [
            "product"
        ],
        "results_from": 0,
        "results_size": 0,
    }
    let xhr = new XMLHttpRequest();
    let url = "api/search";
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            let jsonResponse = JSON.parse(xhr.responseText);
            vm.products = []
            jsonResponse.facets.product.forEach((value) => {
              vm.products.push(value.term);
            });
        }
    }
    xhr.send(JSON.stringify(meow));
}

function loadVersions() {
  let meow = {
        "facets": [
            "version"
        ],
        "results_from": 0,
        "results_size": 0,
    };

    let xhr = new XMLHttpRequest();
    let url = "api/search";
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            let jsonResponse = JSON.parse(xhr.responseText);
            vm.versions = []
            jsonResponse.facets.version.forEach((value) => {
              vm.versions.push(value.term);
            });
        }
    }
    xhr.send(JSON.stringify(meow));
}


function loadPlatforms() {
  let meow = {
        "facets": [
            "platform"
        ],
        "results_from": 0,
        "results_size": 0,
    }
    let xhr = new XMLHttpRequest();
    let url = "api/search";
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            let jsonResponse = JSON.parse(xhr.responseText);
            vm.platforms = []
            jsonResponse.facets.platform.forEach((value) => {
              vm.platforms.push(value.term);
            });
        }
    }
    xhr.send(JSON.stringify(meow));
}

function loadSignatureTable() {
let meow = {
        "facets": [
            "signature"
        ],
        "results_from": 0,
        "results_size": 0,
    }

    meow.filters = [];
    vm.selected_versions.forEach((value) => {
      meow.filters.push({name: "version", value: value});
    });
    vm.selected_products.forEach((value) => {
      meow.filters.push({name: "product", value: value});
    });
    vm.selected_platforms.forEach((value) => {
      meow.filters.push({name: "platform", value: value});
    });

    let xhr = new XMLHttpRequest();
    let url = "api/search";
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            let jsonResponse = JSON.parse(xhr.responseText);
            let rank = 1;
            console.log("Meow");
            vm.search_result_facet_items = [];
            jsonResponse.facets.signature.forEach((value) => {
              let m = {
                signature: value.term,
                count: value.count,
                percentage: 0,
                rank: rank
              }
              vm.search_result_facet_items.push(m);
              ++rank;
            });
        }
    }
    xhr.send(JSON.stringify(meow));
}

loadProducts();
loadVersions();
loadPlatforms();
loadSignatureTable();

//setInterval(loadSignatureTable, 1000);