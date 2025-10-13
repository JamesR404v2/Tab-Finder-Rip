/*
 * Focus on the filter input, display a list of all tabs, and
 * initialize the live text filter and tab link selection.
 */
function init() {

  var tabFilter = document.getElementById("tab-filter");

  if (location.search != "?focusHack") location.search = "?focusHack";

  tabFilter.focus();
  setTimeout(function() { tabFilter.focus(); }, 100);


  // List all tabs
  getAllTabs().then((tabs) => {
    let tabsList = document.getElementById('tabs-list');
    let currentTabs = document.createDocumentFragment();
    let limit = 400;
    let counter = 0;

    tabsList.textContent = '';

    for (let tab of tabs) {
      if (counter <= limit) {
        let tabLink = document.createElement('a');

        // Create favicon
        if (tab.favIconUrl) {
          let favicon = document.createElement('img');
          favicon.classList.add('tab-favicon');
          favicon.src = tab.favIconUrl;
          favicon.setAttribute('alt', '');
          tabLink.appendChild(favicon);
        }

        // Create tab title span
        let tabTitle = document.createElement('span');
        tabTitle.classList.add('tab-title');
        tabTitle.textContent = tab.title || tab.id;
        tabLink.appendChild(tabTitle);

        // Create audio icon if tab is playing audio
        if (tab.audible) {
          let audioIcon = document.createElement('span');
          audioIcon.classList.add('audio-icon');
          audioIcon.textContent = '🔊';
          audioIcon.setAttribute('title', 'Playing audio');
          tabLink.appendChild(audioIcon);
        }

        // Create close button
        let closeBtn = document.createElement('span');
        closeBtn.classList.add('close-tab');
        closeBtn.textContent = '×';
        closeBtn.setAttribute('title', 'Close tab');
        closeBtn.dataset.tab_id = tab.id;
        tabLink.appendChild(closeBtn);

        tabLink.setAttribute('href', tab.id);
        tabLink.classList.add('tab-link', 'shown');
        tabLink.dataset.tab_url = tab.url;
        tabLink.dataset.audible = tab.audible ? 'true' : 'false';
        currentTabs.appendChild(tabLink);
      }

      counter += 1;
    }

    tabsList.appendChild(currentTabs);

    initFilter();

  });
}

/*
 * Intialize tab text filter and selection
 */
function initFilter() {

  var tabFilter = document.getElementById("tab-filter"),
      tabLinks = document.getElementsByClassName("tab-link"),
      tabCount = tabLinks.length,
      selectedTabLink = resetSelectedTabLink();

  tabFilter.onkeyup = function(e) {

    var matcher = new RegExp(tabFilter.value, "gi");

    switch(e.which) {

      // Enter: go to the selected tab
      case 13:
        if (document.getElementsByClassName("tab-link selected")[0]) {
          document.getElementsByClassName("tab-link selected")[0].click();
        }
        break;

      // Up arrow: Select the previous visible tab link
      case 38:
        if (previousAvailable(selectedTabLink)) {
          selectedTabLink.classList.remove('selected');
          selectedTabLink = previousAvailable(selectedTabLink);
          selectedTabLink.classList.add('selected');
        }
        break;

      // Down arrow: Select the next visible tab link
      case 40:
        if (nextAvailable(selectedTabLink)) {
          selectedTabLink.classList.remove('selected');
          selectedTabLink = nextAvailable(selectedTabLink);
          selectedTabLink.classList.add('selected');
        }
        break;

      // Filter the tabs
      default:
        var filterValue = tabFilter.value.toLowerCase();
        var isAudioSearch = filterValue === 'sound' || filterValue === 'audio';

        for (var i=0; i<tabCount; i++) {
          var tabLink = tabLinks[i];
          var tabTitle = tabLink.querySelector('.tab-title');
          var titleText = tabTitle ? tabTitle.textContent : tabLink.textContent;
          var isAudible = tabLink.dataset.audible === 'true';

          // Match if: title/URL matches OR (searching for audio/sound AND tab is audible)
          if (matcher.test(titleText) || matcher.test(tabLink.dataset.tab_url) || (isAudioSearch && isAudible)) {
            tabLink.classList.add("shown");
            tabLink.classList.remove("hidden");
          }
          else {
            tabLink.classList.add("hidden");
            tabLink.classList.remove("shown");
          }
        }
        selectedTabLink = resetSelectedTabLink();
    }
  }

  // Initialize tab link hover selection
  for (var i=0; i<tabCount; i++) {
    var tabLink = tabLinks[i];
    tabLink.addEventListener('mouseenter', function(e) {
      if (document.getElementsByClassName("tab-link selected")[0]) {
        document.getElementsByClassName("tab-link selected")[0].classList.remove('selected');
      }
      e.target.classList.add('selected');
    });

    tabLink.addEventListener('mouseleave', function(e) {
      e.target.classList.remove('selected');
    });
  }
}

/*
 * Deselect any selected tab links, and select the first available one
 */
function resetSelectedTabLink() {
  var selectedTabLink = document.getElementsByClassName("tab-link selected");

  for (var i=0; i<selectedTabLink.length; i++) {
    selectedTabLink[i].classList.remove('selected');
  }

  selectedTabLink = document.getElementsByClassName("tab-link shown")[0];

  selectedTabLink.classList.add('selected');

  return selectedTabLink;
}

/*
 * Return the next sibling that's visible (available for selection)
 */
function nextAvailable(tabLink) {
  if (!tabLink) return false;

  var nextSib = tabLink.nextSibling;

  if (nextSib) {
    if (nextSib.classList.contains('shown')) return nextSib;
    else return nextAvailable(nextSib);
  }

  return false;
}

/*
 * Return the previous sibling that's visible (available for selection)
 */
function previousAvailable(tabLink) {
  if (!tabLink) return false;

  var prevSib = tabLink.previousSibling;

  if (prevSib) {
    if (prevSib.classList.contains('shown')) return prevSib;
    else return previousAvailable(prevSib);
  }

  return false;
}

function getCurrentWindowTabs() {
  return browser.tabs.query({currentWindow: true});
}

function getAllTabs() {
  return browser.tabs.query({});
}

/*
 * Handle close button clicks and tab activation
 */
document.addEventListener("click", (e) => {

  // Handle close button clicks
  if (e.target.classList.contains('close-tab')) {
    e.stopPropagation();
    var tabId = +e.target.dataset.tab_id;

    // Close the tab
    browser.tabs.remove(tabId).then(() => {
      // Remove the tab link from the DOM
      e.target.parentElement.remove();
      // Reset the selected tab link
      if (document.getElementsByClassName("tab-link shown").length > 0) {
        resetSelectedTabLink();
      }
    });

    e.preventDefault();
    return;
  }

  // Handle tab link clicks (activate tab)
  if (e.target.classList.contains('tab-link') || e.target.classList.contains('tab-title') || e.target.classList.contains('audio-icon') || e.target.classList.contains('tab-favicon')) {

    // Get the tab link element
    var tabLink = e.target.classList.contains('tab-link') ? e.target : e.target.closest('.tab-link');
    var tabId = +tabLink.getAttribute('href');

    getAllTabs().then((tabs) => {
      for (var tab of tabs) {
        if (tab.id === tabId) {
          browser.tabs.update(tabId, {
            active: true
          });
          browser.windows.update(tab.windowId, {
            focused: true
          });
          window.close();
        }
      }
    });
  }
  else document.getElementById("tab-filter").focus();

  e.preventDefault();
});

/*
 * Load and apply settings from storage
 */
function loadSettings() {
  return browser.storage.local.get(['theme', 'width', 'height', 'fontSize', 'showFavicon']).then((result) => {
    console.log('Settings loaded:', result);
    const theme = result.theme || 'auto';
    const width = result.width || 800;
    const height = result.height || 600;
    const fontSize = result.fontSize || 1.0;
    const showFavicon = result.showFavicon !== undefined ? result.showFavicon : true;

    console.log('Applying theme:', theme, 'width:', width, 'height:', height, 'fontSize:', fontSize, 'showFavicon:', showFavicon);

    // Apply theme
    applyTheme(theme);

    // Apply width
    applyWidth(width);

    // Apply height
    applyHeight(height);

    // Apply font size
    applyFontSize(fontSize);

    // Apply favicon visibility
    applyFaviconVisibility(showFavicon);
  }).catch((error) => {
    console.error('Error loading settings:', error);
    // Apply defaults on error
    applyTheme('auto');
    applyWidth(800);
    applyHeight(600);
    applyFontSize(1.0);
    applyFaviconVisibility(true);
  });
}

function applyTheme(theme) {
  const body = document.body;

  // Remove existing theme classes
  body.classList.remove('theme-light', 'theme-dark', 'theme-auto');

  // Add new theme class
  body.classList.add('theme-' + theme);
}

function applyWidth(width) {
  document.documentElement.style.setProperty('width', width + 'px', 'important');
  document.body.style.setProperty('width', width + 'px', 'important');
}

function applyHeight(height) {
  document.documentElement.style.setProperty('height', height + 'px', 'important');
  document.body.style.setProperty('height', height + 'px', 'important');
}

function applyFontSize(fontSize) {
  // Convert rem to pixels (1rem = 16px by default)
  const fontSizeInPixels = fontSize * 16;
  document.documentElement.style.setProperty('font-size', fontSizeInPixels + 'px', 'important');
}

function applyFaviconVisibility(showFavicon) {
  const body = document.body;
  if (showFavicon) {
    body.classList.remove('hide-favicons');
  } else {
    body.classList.add('hide-favicons');
  }
}

// Listen for storage changes to update settings in real-time
browser.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') {
    if (changes.theme) {
      applyTheme(changes.theme.newValue);
    }
    if (changes.width) {
      applyWidth(changes.width.newValue);
    }
    if (changes.height) {
      applyHeight(changes.height.newValue);
    }
    if (changes.fontSize) {
      applyFontSize(changes.fontSize.newValue);
    }
    if (changes.showFavicon) {
      applyFaviconVisibility(changes.showFavicon.newValue);
    }
  }
});

// Let's do this!
document.addEventListener("DOMContentLoaded", () => {
  // Load settings first, then initialize
  loadSettings().then(() => {
    init();
  });
});
