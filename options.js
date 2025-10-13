/*
 * Load and apply settings
 */
function loadSettings() {
  browser.storage.local.get(['theme', 'width', 'height', 'fontSize', 'showFavicon']).then((result) => {
    const theme = result.theme || 'auto';
    const width = result.width || 700;
    const height = result.height || 600;
    const fontSize = result.fontSize || 1.0;
    const showFavicon = result.showFavicon !== undefined ? result.showFavicon : true;

    // Apply theme to options page
    applyTheme(theme);
    document.getElementById('theme-select').value = theme;

    // Set width value
    document.getElementById('width-input').value = width;

    // Set height value
    document.getElementById('height-input').value = height;

    // Set font size value
    document.getElementById('font-size-input').value = fontSize;

    // Set show favicon checkbox
    document.getElementById('show-favicon-checkbox').checked = showFavicon;
  });
}

function applyTheme(theme) {
  const body = document.body;

  // Remove existing theme classes
  body.classList.remove('theme-light', 'theme-dark', 'theme-auto');

  // Add new theme class
  body.classList.add('theme-' + theme);
}

function saveSettings() {
  const theme = document.getElementById('theme-select').value;
  const width = parseInt(document.getElementById('width-input').value);
  const height = parseInt(document.getElementById('height-input').value);
  const fontSize = parseFloat(document.getElementById('font-size-input').value);
  const showFavicon = document.getElementById('show-favicon-checkbox').checked;

  browser.storage.local.set({
    theme: theme,
    width: width,
    height: height,
    fontSize: fontSize,
    showFavicon: showFavicon
  }).then(() => {
    // Show success message
    const status = document.getElementById('status');
    status.textContent = 'Settings saved.';
    status.className = 'status-message success show';

    // Apply theme to options page immediately
    applyTheme(theme);

    // Hide message after 3 seconds
    setTimeout(() => {
      status.classList.remove('show');
    }, 3000);
  });
}

/*
 * Initialize settings page
 */
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();

  const themeSelect = document.getElementById('theme-select');
  const widthInput = document.getElementById('width-input');
  const heightInput = document.getElementById('height-input');
  const fontSizeInput = document.getElementById('font-size-input');
  const showFaviconCheckbox = document.getElementById('show-favicon-checkbox');

  // Save on change
  themeSelect.addEventListener('change', saveSettings);
  widthInput.addEventListener('change', saveSettings);
  heightInput.addEventListener('change', saveSettings);
  fontSizeInput.addEventListener('change', saveSettings);
  showFaviconCheckbox.addEventListener('change', saveSettings);
});
